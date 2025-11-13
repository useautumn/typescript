/** biome-ignore-all lint/style/noNonNullAssertion: no other choice */
import type { Autumn, AutumnError } from "@sdk";

import useSWR, { type SWRConfiguration } from "swr";
import {
	type AutumnContextParams,
	type AutumnContextType,
	useAutumnContext,
} from "@/AutumnContext";
import type { ConvexAutumnClient } from "@/client/ConvexAutumnClient";
import type { AutumnClient } from "@/client/ReactAutumnClient";
import type { CheckParams, CustomerCreateParams } from "@/clientTypes";
import { handleCheck, openDialog } from "./helpers/handleCheck";
import { useAutumnBase } from "./helpers/useAutumnBase";

import type { UseCustomerMethods } from "./types/useCustomerMethods";

export interface UseCustomerResult extends UseCustomerMethods {
	/** The current customer data including subscription and feature information */
	data: Autumn.Customer | null;

	/** Whether customer data is currently being loaded */
	isLoading: boolean;

	/** Any error that occurred while fetching customer data */
	error: AutumnError | null;

	/** Refetches the customer data from the server */
	refetch: () => Promise<Autumn.Customer | null>;

	// All hook methods (attach, checkout, check, etc.) are inherited from UseCustomerMethods
}

export interface UseCustomerParams {
	errorOnNotFound?: boolean;
	expand?: Autumn.Customers.CustomerGetParams["expand"];
	swrConfig?: SWRConfiguration;
}

/**
 * Access a customer's state and use it to display information in your React app.
 *
 * The `useCustomer` hook provides access to customer data and related operations. You can use it from your frontend to retrieve customer information, manage loading states, and create entities.
 *
 * @param params.expand - Additional data to include (invoices, rewards, trials_used, entities, referrals, payment_method) (optional)
 * @param params.errorOnNotFound - Whether to throw error if customer not found (optional)
 * @param params.swrConfig - SWR configuration options (optional)
 *
 * @returns data - Customer object with subscription and feature data
 * @returns isLoading - Whether customer data is being fetched
 * @returns error - Any error that occurred while fetching
 * @returns refetch - Refetch customer data
 * @returns ...methods - All subscription methods (attach, checkout, cancel, track, setupPayment, openBillingPortal, createReferralCode, redeemReferralCode)
 * @returns createEntity - Create entities for granular feature tracking
 *
 * @see {@link https://docs.useautumn.com/api-reference/hooks/useCustomer}
 */
export const useCustomerBase = ({
	params,
	AutumnContext,
	client,
}: {
	params?: UseCustomerParams;
	AutumnContext?: AutumnContextType;
	client?: AutumnClient | ConvexAutumnClient;
}): UseCustomerResult => {
	let context: AutumnContextParams | undefined;

	if (AutumnContext) {
		// biome-ignore lint/correctness/useHookAtTopLevel: needed
		context = useAutumnContext({
			AutumnContext,
			name: "useCustomer",
		});
	}

	if (!client) {
		client = context?.client;
	}

	const baseUrl = client?.backendUrl || "";
	const queryKey = ["customer", baseUrl, params?.expand];

	const fetchCustomer = async () => {
		return await client?.createCustomer({
			errorOnNotFound: params?.errorOnNotFound,
			expand: params?.expand?.join(",") as CustomerCreateParams["expand"],
		});
	};

	const {
		data: customer,
		error,
		isLoading,
		mutate,
	} = useSWR(queryKey, fetchCustomer, {
		// Default to 5 minutes
		fallbackData: null,
		swrConfig: {
			shouldRetryOnError: false,
			refreshInterval: 0,
			...params?.swrConfig,
		},
	});

	const autumnFunctions = useAutumnBase({
		context,
		client: client!,
		refetchCustomer: mutate,
	});

	return {
		data: error ? null : customer,
		isLoading,
		error,
		refetch: mutate as () => Promise<Autumn.Customer | null>,

		...autumnFunctions,
		createReferralCode: client!.referrals.createCode,
		redeemReferralCode: client!.referrals.redeemCode,

		check: (params: CheckParams) => {
			const res = handleCheck({
				customer,
				params,
				isEntity: false,
				context,
			});

			openDialog({
				result: res,
				params,
				context: context!,
			});

			return res;
		},
	};
};
