import type {
  Autumn,
  AutumnError,
} from "@sdk";


import type React from "react";
import useSWR, { type SWRConfiguration } from "swr";

import { handleCheck, openDialog } from "./helpers/handleCheck";
import { ConvexAutumnClient } from "@/client/ConvexAutumnClient";
import { AutumnClient } from "@/client/ReactAutumnClient";
import { AutumnContextParams, useAutumnContext } from "@/AutumnContext";
import { useAutumnBase } from "./helpers/useAutumnBase";
import { AttachParams, CheckoutParams, CancelParams, TrackParams, SetupPaymentParams, BillingPortalParams, CheckParams, EntityCreateParams } from "@/clientTypes";

export interface UseCustomerResult {  
  /** The current customer data including subscription and feature information */
  customer: Autumn.Customer | null;
  /** Whether customer data is currently being loaded */
  isLoading: boolean;
  /** Any error that occurred while fetching customer data */
  error: AutumnError | null;

  // Autumn functions
  /**
   * Attaches a product to the current customer, enabling access and handling billing.
   * Activates a product and applies all product items with automatic payment handling.
   */
  attach: (params: AttachParams) => Promise<Autumn.AttachResponse>;

  /**
   * Tracks usage events for metered features.
   * Records feature usage and updates customer balances server-side.
   */
  track: (params: TrackParams) => Promise<Autumn.TrackResponse>;

  /**
   * Cancels a customer's subscription or product attachment.
   * Can cancel immediately or at the end of the billing cycle.
   */
  cancel: (params: CancelParams) => Promise<Autumn.CancelResponse>;

  /**
   * Sets up a payment method for the customer.
   * Collects payment information without immediately charging.
   */
  setupPayment: (
    params: SetupPaymentParams
  ) => Promise<Autumn.SetupPaymentResponse>;

  /**
   * Opens the Stripe billing portal for the customer.
   * Allows customers to manage their subscription and payment methods.
   */
  openBillingPortal: (
    params?: BillingPortalParams
  ) => Promise<Autumn.BillingPortalResponse>;

  /**
   * Initiates a checkout flow for product purchase.
   * Handles payment collection and redirects to Stripe checkout when needed.
   */
  checkout: (params: CheckoutParams) => Promise<Autumn.CheckoutResponse>;

  /** Refetches the customer data from the server */
  refetch: () => Promise<Autumn.Customer | null>;

  /**
   * Creates new entities for granular feature tracking.
   * Entities allow per-user or per-workspace feature limits.
   */
  createEntity: (
    params: EntityCreateParams
  ) => Promise<Autumn.Entity>;

  /**
   * Checks if a customer has access to a feature and shows paywalls if needed.
   * Client-side feature gating with optional dialog display for upgrades.
   */
  check: (params: CheckParams) => Autumn.CheckResponse;

  // /**
  //  * Creates a referral code for the customer.
  //  * Generates codes that can be shared for referral programs.
  //  */
  // createReferralCode: (
  //   params: CreateReferralCodeParams
  // ) => AutumnPromise<CreateReferralCodeResult>;

  // /**
  //  * Redeems a referral code for the customer.
  //  * Applies referral benefits when a valid code is provided.
  //  */
  // redeemReferralCode: (
  //   params: RedeemReferralCodeParams
  // ) => AutumnPromise<RedeemReferralCodeResult>;

  
}

export interface UseCustomerParams {
  errorOnNotFound?: boolean;
  expand?: Autumn.Customers.CustomerGetParams['expand'];
  swrConfig?: SWRConfiguration;
}

export const useCustomerBase = ({
  params,
  AutumnContext,
  client,
}: {
  params?: UseCustomerParams;
  AutumnContext?: React.Context<any>;
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
    client = context!.client;
  }

  const baseUrl = client?.backendUrl || "";
  const queryKey = ["customer", baseUrl, params?.expand];

  const fetchCustomer = async () => {
    return await client!.createCustomer({
      errorOnNotFound: params?.errorOnNotFound,
      expand: params?.expand?.join(","),
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
    client,
    refetchCustomer: mutate,
  });

  return {
    customer: error ? null : customer,
    isLoading,
    error,
    refetch: mutate as () => Promise<Autumn.Customer | null>,

    ...autumnFunctions,
    createEntity: client.entities.create,
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
