import {
  Customer,
  AutumnError,
  AutumnPromise,
  Entity,
  CreateReferralCodeResult,
  RedeemReferralCodeResult,
  CustomerExpandOption,
  BillingPortalResult,
  AttachResult,
  CheckResult,
  TrackResult,
  CancelResult,
} from "@sdk";
import { CreateEntityParams } from "../client/types/clientEntTypes";
import {
  CreateReferralCodeParams,
  RedeemReferralCodeParams,
} from "../client/types/clientReferralTypes";
import useSWR from "swr";
import React, { useContext } from "react";
import { AutumnClient } from "../client/ReactAutumnClient";
import { AutumnContextParams, useAutumnContext } from "../AutumnContext";
import { useAutumnBase } from "./useAutumnBase";
import { AttachParams, CancelParams, CheckParams, OpenBillingPortalParams, TrackParams } from "@/client/types/clientGenTypes";
import { AllowedParams, handleAllowed } from "./handleAllowed";

export interface UseCustomerResult {
  customer: Customer | null;
  isLoading: boolean;
  error: AutumnError | null;

  // Autumn functions
  attach: (params: AttachParams) => AutumnPromise<AttachResult>;
  check: (params: CheckParams) => AutumnPromise<CheckResult>;
  track: (params: TrackParams) => AutumnPromise<TrackResult>;
  cancel: (params: CancelParams) => AutumnPromise<CancelResult>;
  openBillingPortal: (params?: OpenBillingPortalParams) => AutumnPromise<BillingPortalResult>;

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
}


const emptyDefaultFunctions = {
  attach: "" as any,
  check: "" as any,
  track: "" as any,
  cancel: "" as any,
  openBillingPortal: "" as any,
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
  const queryKey = ["customer"];
  
  let context: AutumnContextParams | undefined;
  if (AutumnContext) {
    context = useAutumnContext({ AutumnContext, name: "useCustomer" });
  }

  if (!client) {
    client = context!.client;
  }

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

  const { data: customer, error, isLoading, mutate } = useSWR(queryKey, fetchCustomer, {
    fallbackData: null,
    onErrorRetry: (error: any, key: any, config: any) => {
      if (error.code == "entity_not_found") {
        return false;
      }

      return true;
    },
  });

  let autumnFunctions = emptyDefaultFunctions;
  if (AutumnContext) {
    autumnFunctions = useAutumnBase({ AutumnContext })
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
    allowed: (params: AllowedParams): boolean => handleAllowed({ customer, params }),
  };
};
