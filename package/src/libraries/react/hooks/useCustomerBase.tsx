import {
	Customer,
	AutumnError,
	AutumnPromise,
	Entity,
	CreateReferralCodeResult,
	RedeemReferralCodeResult,
	CustomerExpandOption,
	BillingPortalResult,
	CheckResult,
	TrackResult,
	CancelResult,
	SetupPaymentResult,
} from "@sdk";
import { CreateEntityParams } from "../client/types/clientEntTypes";
import {
	CreateReferralCodeParams,
	RedeemReferralCodeParams,
} from "../client/types/clientReferralTypes";
import useSWR, { SWRConfiguration } from "swr";
import React, { useEffect } from "react";
import { AutumnClient } from "../client/ReactAutumnClient";
import { AutumnContextParams, useAutumnContext } from "../AutumnContext";
import { useAutumnBase } from "./helpers/useAutumnBase";
import {
	CancelParams,
	CheckParams,
	OpenBillingPortalParams,
	SetupPaymentParams,
	TrackParams,
} from "@/client/types/clientGenTypes";
import { AllowedParams, handleCheck, openDialog } from "./helpers/handleCheck";
import { AttachParams, CheckoutParams } from "@/client/types/clientAttachTypes";
import { AttachResult, CheckoutResult } from "@sdk/general/attachTypes";
import { Result, Success } from "@sdk/response";

export interface UseCustomerResult {
	customer: Customer | null;
	isLoading: boolean;
	error: AutumnError | null;

	// Autumn functions
	attach: (params: AttachParams) => AutumnPromise<AttachResult | CheckResult>;
	// check: (params: CheckParams) => AutumnPromise<CheckResult>;
	track: (params: TrackParams) => AutumnPromise<TrackResult>;
	cancel: (params: CancelParams) => AutumnPromise<CancelResult>;
	setupPayment: (
		params: SetupPaymentParams
	) => AutumnPromise<SetupPaymentResult>;
	openBillingPortal: (
		params?: OpenBillingPortalParams
	) => AutumnPromise<BillingPortalResult>;
	checkout: (params: CheckoutParams) => AutumnPromise<CheckoutResult>;
	refetch: () => Promise<Customer | null>;
	createEntity: (
		params: CreateEntityParams | CreateEntityParams[]
	) => AutumnPromise<Entity | Entity[]>;
	createReferralCode: (
		params: CreateReferralCodeParams
	) => AutumnPromise<CreateReferralCodeResult>;
	redeemReferralCode: (
		params: RedeemReferralCodeParams
	) => AutumnPromise<RedeemReferralCodeResult>;

	check: (params: CheckParams) => Success<CheckResult>;
	allowed: (params: AllowedParams) => boolean;
}

export interface UseCustomerParams {
	errorOnNotFound?: boolean;
	expand?: CustomerExpandOption[];
	swrConfig?: SWRConfiguration;
}

export const useCustomerBase = ({
	params,
	AutumnContext,
	client,
}: {
	params?: UseCustomerParams;
	AutumnContext?: React.Context<any>;
	client?: AutumnClient;
}): UseCustomerResult => {
	let context: AutumnContextParams | undefined;

	if (AutumnContext) {
		context = useAutumnContext({
			AutumnContext,
			name: "useCustomer",
		});
	}

	if (!client) {
		client = context!.client;
	}

	let baseUrl = client?.backendUrl || "";
	const queryKey = ["customer", baseUrl, params?.expand];

	const fetchCustomer = async () => {
		const { data, error } = await client!.createCustomer({
			errorOnNotFound: params?.errorOnNotFound,
			expand: params?.expand,
		});

		if (error) {
			throw error;
		}

		if (!data) {
			return null;
		}

		return data;
	};

	const {
		data: customer,
		error,
		isLoading,
		mutate,
	} = useSWR(queryKey, fetchCustomer, {
		fallbackData: null,
		// Default to 5 minutes
		swrConfig: { refreshInterval: 1000 * 60 * 5, ...params?.swrConfig },
	});

	const autumnFunctions = useAutumnBase({
		context,
		client,
		refetchCustomer: mutate,
	});

	useEffect(() => {
		// console.log("Paywall ref:", context?.paywallRef.current);
		// context?.paywallDialog.setOpen(true);
		// context?.paywallDialog.setProps(params);
		// context?.paywallDialog.setOpen(true);
	}, [context?.paywallRef.current]);

	return {
		customer: error ? null : customer,
		isLoading,
		error,
		refetch: mutate as any,

		...autumnFunctions,
		createEntity: client!.entities.create,
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
				result: res.data,
				params,
				context: context!,
			});

			return res;
		},

		/** @deprecated Use check() instead */
		allowed: (params: AllowedParams): boolean => {
			const result = handleCheck({
				customer,
				params,
				isEntity: false,
				context,
			});

			return result.data!.allowed;
		},
	};
};
