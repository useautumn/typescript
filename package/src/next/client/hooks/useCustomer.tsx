import { AutumnError } from "../../../sdk";
import { Customer, CustomerData } from "../../../sdk";

import { useEffect, useState } from "react";
import { useAutumnContext } from "../AutumnContext";
import {
  getOrCreateCustomer,
  getCustomer,
  createEntityAction,
  deleteEntityAction,
} from "../../server/cusActions";
import { CustomerExpandOption } from "../../../sdk/customers/cusEnums";
import { CreateEntityParams } from "./types";
import { CreateEntityParams as ServerCreateEntityParams } from "../../../sdk/customers/entities/entTypes";
import { toClientErrorResponse } from "../clientUtils";

export interface UseCustomerProps {
  expand?: CustomerExpandOption[];
  autoCreate?: boolean;
}

const defaultOptions: UseCustomerProps = {
  expand: undefined,
  autoCreate: true,
};

// Delete entity
const deleteEntity = async ({
  encryptedCustomerId,
  entityId,
}: {
  encryptedCustomerId?: string;
  entityId: string;
}) => {
  const result = await deleteEntityAction({
    encryptedCustomerId,
    entityId,
  });

  if (result.error) {
    return toClientErrorResponse(result.error);
  }

  return result;
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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCustomer = async () => {
    setIsLoading(true);

    let returnData: Customer | null = null;
    try {
      let data: Customer | null = null;
      let error: AutumnError | null = null;
      if (autoCreate) {
        const result = await getOrCreateCustomer({
          encryptedCustomerId,
          customerData,
          params: {
            expand: finalOptions.expand,
          },
        });
        data = result.data;
        error = result.error;
      } else {
        const result = await getCustomer({
          encryptedCustomerId,
          params: {
            expand: finalOptions.expand,
          },
        });
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.log("(Autumn) Error fetching customer:", error);
        setError(error);
      } else {
        setCustomer(data);
        setError(null);
      }
      returnData = data;
    } catch (error) {
      console.error("(Autumn) Error fetching customer:", error);
      setError(error as AutumnError);
    }
    setIsLoading(false);
    return returnData;
  };

  const refetch = async () => {
    await fetchCustomer();
  };

  const createEntity = async (
    params: CreateEntityParams | CreateEntityParams[]
  ) => {
    let snakeParams: ServerCreateEntityParams[] = [];
    if (Array.isArray(params)) {
      snakeParams = params.map((param) => ({
        ...param,
        feature_id: param.featureId,
      }));
    } else {
      snakeParams = [{ ...params, feature_id: params.featureId }];
    }
    const result = await createEntityAction({
      encryptedCustomerId,
      entity: snakeParams,
    });

    if (result.error) {
      return toClientErrorResponse(result.error);
    }

    return result;
  };

  useEffect(() => {
    fetchCustomer();
  }, [encryptedCustomerId]);

  return {
    customer,
    isLoading,
    error,
    refetch,
    createEntity,
    deleteEntity: (entityId: string) =>
      deleteEntity({ encryptedCustomerId, entityId }),
  };
};
