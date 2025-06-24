import {
  Customer,
  AutumnError,
  AutumnPromise,
  Entity,
  CreateReferralCodeResult,
  RedeemReferralCodeResult,
  CustomerExpandOption,
} from "../../../sdk";
import { CreateEntityParams } from "../client/types/clientEntTypes";
import {
  CreateReferralCodeParams,
  RedeemReferralCodeParams,
} from "../client/types/clientReferralTypes";
import useSWR from "swr";
import React, { useContext } from "react";
import { AutumnClient } from "../client/ReactAutumnClient";
import { AutumnContextParams, useAutumnContext } from "../AutumnContext";

export interface UseCustomerResult {
  customer: Customer | null;
  isLoading: boolean;
  error: AutumnError | null;
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
}

export interface UseCustomerParams {
  errorOnNotFound?: boolean;
  expand?: CustomerExpandOption[];
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

  const { data, error, isLoading, mutate } = useSWR(queryKey, fetchCustomer, {
    fallbackData: null,
    onErrorRetry: (error: any, key: any, config: any) => {
      if (error.code == "entity_not_found") {
        return false;
      }

      return true;
    },
  });

  return {
    customer: error ? null : data,
    isLoading,
    error,
    refetch: mutate as any,
    createEntity: client!.entities.create,
    createReferralCode: client!.referrals.createCode,
    redeemReferralCode: client!.referrals.redeemCode,
  };
};
