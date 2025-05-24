import { useAutumnContext } from "../AutumnContext";
import { useEffect } from "react";
import { UseCustomerParams } from "./useCustomerProvider";
import {
  Customer,
  AutumnError,
  CreateEntityParams,
  AutumnPromise,
  Entity,
} from "../../../sdk";

interface UseCustomerResult {
  customer: Customer | null;
  isLoading: boolean;
  error: AutumnError | null;
  refetch: () => Promise<void>;
}

export const useCustomer = (params?: UseCustomerParams) => {
  const { customerProvider, client } = useAutumnContext();

  const { getState, refetch } = customerProvider;

  const { customer, isLoading, error } = getState(params);

  useEffect(() => {
    if (!customer) {
      refetch({ params });
    }
  }, []);

  return {
    customer,
    isLoading: isLoading && !customer,
    error,
    refetch: async () => {
      await refetch({ params });
    },
    createEntity: client.entities.create,
  } as UseCustomerResult;
};
