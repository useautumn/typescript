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
import type {
	CheckParams,
	CustomerCreateParams,
	EntityCreateParams,
} from "@/clientTypes";
import { handleCheck, openDialog } from "./helpers/handleCheck";
import { useAutumnBase } from "./helpers/useAutumnBase";

// export interface UseCustomerResult {
// 	/** The current customer data including subscription and feature information */
// 	customer: Autumn.Customer | null;
// 	/** Whether customer data is currently being loaded */
// 	isLoading: boolean;
// 	/** Any error that occurred while fetching customer data */
// 	error: AutumnError | null;

// 	// Autumn functions
// 	/**
// 	 * Attaches a product to the current customer, enabling access and handling billing.
// 	 * Activates a product and applies all product items with automatic payment handling.
// 	 */
// 	attach: (params: AttachParams) => Promise<Autumn.AttachResponse>;

// 	/**
// 	 * Tracks usage events for metered features.
// 	 * Records feature usage and updates customer balances server-side.
// 	 */
// 	track: (params: TrackParams) => Promise<Autumn.TrackResponse>;

// 	/**
// 	 * Cancels a customer's subscription or product attachment.
// 	 * Can cancel immediately or at the end of the billing cycle.
// 	 */
// 	cancel: (params: CancelParams) => Promise<Autumn.CancelResponse>;

// 	/**
// 	 * Sets up a payment method for the customer.
// 	 * Collects payment information without immediately charging.
// 	 */
// 	setupPayment: (
// 		params: SetupPaymentParams,
// 	) => Promise<Autumn.SetupPaymentResponse>;

// 	/**
// 	 * Opens the Stripe billing portal for the customer.
// 	 * Allows customers to manage their subscription and payment methods.
// 	 */
// 	openBillingPortal: (
// 		params?: BillingPortalParams,
// 	) => Promise<Autumn.BillingPortalResponse>;

// 	/**
// 	 * Initiates a checkout flow for product purchase.
// 	 * Handles payment collection and redirects to Stripe checkout when needed.
// 	 */
// 	checkout: (params: CheckoutParams) => Promise<Autumn.CheckoutResponse>;

// 	/** Refetches the customer data from the server */
// 	refetch: () => Promise<Autumn.Customer | null>;

// 	/**
// 	 * Creates new entities for granular feature tracking.
// 	 * Entities allow per-user or per-workspace feature limits.
// 	 */
// 	createEntity: (params: EntityCreateParams) => Promise<Autumn.Entity>;

// 	/**
// 	 * Checks if a customer has access to a feature and shows paywalls if needed.
// 	 * Client-side feature gating with optional dialog display for upgrades.
// 	 */
// 	check: (params: CheckParams) => Autumn.CheckResponse;

// 	// /**
// 	//  * Creates a referral code for the customer.
// 	//  * Generates codes that can be shared for referral programs.
// 	//  */
// 	// createReferralCode: (
// 	//   params: CreateReferralCodeParams
// 	// ) => AutumnPromise<CreateReferralCodeResult>;

// 	// /**
// 	//  * Redeems a referral code for the customer.
// 	//  * Applies referral benefits when a valid code is provided.
// 	//  */
// 	// redeemReferralCode: (
// 	//   params: RedeemReferralCodeParams
// 	// ) => AutumnPromise<RedeemReferralCodeResult>;
// }

import type { UseCustomerMethods } from "./types/useCustomerMethods";

export interface UseCustomerResult extends UseCustomerMethods {
	/** The current customer data including subscription and feature information */
	customer: Autumn.Customer | null;

	/** Whether customer data is currently being loaded */
	isLoading: boolean;

	/** Any error that occurred while fetching customer data */
	error: AutumnError | null;

	/** Refetches the customer data from the server */
	refetch: () => Promise<Autumn.Customer | null>;

	/**
	 * Creates new entities for granular feature tracking.
	 * Entities allow per-user or per-workspace feature limits.
	 */
	createEntity: (params: EntityCreateParams) => Promise<Autumn.Entity>;

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
 * @returns customer - Customer object with subscription and feature data
 * @returns isLoading - Whether customer data is being fetched
 * @returns error - Any error that occurred while fetching
 * @returns refetch - Refetch customer data
 * @returns ...methods - All subscription methods (attach, checkout, cancel, track, setupPayment, openBillingPortal)
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

		// if (error) {
		//   throw error;
		// }

		// if (!data) {
		//   return null;
		// }

		// return data;
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
		customer: error ? null : customer,
		isLoading,
		error,
		refetch: mutate as () => Promise<Autumn.Customer | null>,

		...autumnFunctions,
		createEntity: client?.entities.create!,
		// createReferralCode: client.referrals.createCode,
		// redeemReferralCode: client.referrals.redeemCode,
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
