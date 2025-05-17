import { useAutumnContext } from "../AutumnContext";
import { useEffect } from "react";
import { UseCustomerParams } from "./useCustomerProvider";

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
  };
};
