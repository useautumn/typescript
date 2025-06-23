import {
  Customer,
  AutumnError,
  AutumnPromise,
  Entity,
  CreateReferralCodeResult,
  RedeemReferralCodeResult,
} from "../../../sdk";
import { CreateEntityParams } from "../client/types/clientEntTypes";
import {
  CreateReferralCodeParams,
  RedeemReferralCodeParams,
} from "../client/types/clientReferralTypes";
import useSWR from "swr";
import React, { useContext } from "react";
import { AutumnClient } from "../client/ReactAutumnClient";

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

export const useCustomerBase = ({
  errorOnNotFound,
  AutumnContext,
  client,
}: {
  errorOnNotFound?: boolean;
  AutumnContext: React.Context<any>;
  client?: AutumnClient;
}): UseCustomerResult => {
  const queryKey = ["customer"];
  const context = useContext(AutumnContext);

  if (!client) {
    client = context.client;
  }

  const fetchCustomer = async () => {
    const { data, error } = await client!.createCustomer({
      errorOnNotFound,
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
