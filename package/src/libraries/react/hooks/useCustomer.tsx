import { useAutumnContext } from "../AutumnContext";
import { useEffect } from "react";
import { UseCustomerParams } from "./useCustomerProvider";
import { Customer, AutumnError, AutumnPromise, Entity } from "../../../sdk";
import { CreateEntityParams } from "../client/types/clientEntTypes";

interface UseCustomerResult {
  customer: Customer | null;
  isLoading: boolean;
  error: AutumnError | null;
  refetch: () => Promise<void>;
  createEntity: (
    params: CreateEntityParams | CreateEntityParams[]
  ) => AutumnPromise<Entity | Entity[]>;
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
