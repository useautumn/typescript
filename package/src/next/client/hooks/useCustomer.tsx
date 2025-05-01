import { AutumnError } from "../../../sdk";
import { Customer, CustomerData } from "../../../sdk";

import { useEffect, useState } from "react";
import { useAutumnContext } from "../AutumnContext";
import { getOrCreateCustomer, getCustomer } from "../../server/cusActions";

export interface UseCustomerProps {
  autoCreate?: boolean;
}

const defaultOptions: UseCustomerProps = {
  autoCreate: true,
};

export const useCustomer = (options?: UseCustomerProps) => {
  let finalOptions = defaultOptions;

  if (options) {
    finalOptions = { ...defaultOptions, ...options };
  }
  const { autoCreate } = finalOptions;

  const { encryptedCustomerId, customerData, customer, setCustomer } =
    useAutumnContext();

  const [error, setError] = useState<AutumnError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchCustomer = async () => {
    setIsLoading(true);

    try {
      let data: Customer | null = null;
      let error: AutumnError | null = null;
      if (autoCreate) {
        const result = await getOrCreateCustomer({
          encryptedCustomerId,
          customerData,
        });
        data = result.data;
        error = result.error;
      } else {
        const result = await getCustomer({ encryptedCustomerId });
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.log("(Autumn) Error fetching customer:", error);
        setError(error);
      } else {
        setCustomer(data);
      }
    } catch (error) {
      console.log("Fetch customer error", error);
      setError(error as AutumnError);
    }
    setIsLoading(false);
  };

  const refetch = async () => {
    await fetchCustomer();
  };

  useEffect(() => {
    fetchCustomer();
  }, [encryptedCustomerId]);

  return { customer, isLoading, error, refetch };
};
