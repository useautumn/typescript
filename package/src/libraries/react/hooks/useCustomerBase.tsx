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
import React from "react";
import { AutumnClient } from "../client/ReactAutumnClient";
import { AutumnContextParams, useAutumnContext } from "../AutumnContext";
import { useAutumnBase } from "./useAutumnBase";
import {
  CancelParams,
  CheckParams,
  OpenBillingPortalParams,
  SetupPaymentParams,
  TrackParams,
} from "@/client/types/clientGenTypes";
import { AllowedParams, handleAllowed } from "./handleAllowed";
import { AttachParams, CheckoutParams } from "@/client/types/clientAttachTypes";
import { AttachResult } from "@sdk/general/attachTypes";

export interface UseCustomerResult {
  customer: Customer | null;
  isLoading: boolean;
  error: AutumnError | null;

  // Autumn functions
  attach: (params: AttachParams) => AutumnPromise<AttachResult>;
  check: (params: CheckParams) => AutumnPromise<CheckResult>;
  track: (params: TrackParams) => AutumnPromise<TrackResult>;
  cancel: (params: CancelParams) => AutumnPromise<CancelResult>;
  setupPayment: (
    params: SetupPaymentParams
  ) => AutumnPromise<SetupPaymentResult>;
  openBillingPortal: (
    params?: OpenBillingPortalParams
  ) => AutumnPromise<BillingPortalResult>;
  checkout: (params: CheckoutParams) => AutumnPromise<CheckResult>;
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

  allowed: (params: AllowedParams) => boolean;
}

export interface UseCustomerParams {
  errorOnNotFound?: boolean;
  expand?: CustomerExpandOption[];
  swrConfig?: SWRConfiguration;
  // authClient?: any;
}

const emptyDefaultFunctions = {
  attach: "" as any,
  check: "" as any,
  track: "" as any,
  cancel: "" as any,
  openBillingPortal: "" as any,
  setupPayment: "" as any,
  checkout: "" as any,
};

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
  // let authClientExists = !!params?.authClient;

  if (AutumnContext) {
    context = useAutumnContext({
      AutumnContext,
      name: "useCustomer",
      // errorIfNotInitialized: !authClientExists,
    });
  }

  // if (authClientExists) {
  //   client = params?.authClient?.autumn;
  // } else
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
    ...params?.swrConfig,
  });

  let autumnFunctions = emptyDefaultFunctions;
  if (AutumnContext) {
    autumnFunctions = useAutumnBase({
      AutumnContext: AutumnContext!,
      refetchCustomer: mutate,
    });
  }

  return {
    customer: error ? null : customer,
    isLoading,
    error,
    refetch: mutate as any,

    ...autumnFunctions,
    createEntity: client!.entities.create,
    createReferralCode: client!.referrals.createCode,
    redeemReferralCode: client!.referrals.redeemCode,
    allowed: (params: AllowedParams): boolean =>
      handleAllowed({ customer, params }),
  };
};
