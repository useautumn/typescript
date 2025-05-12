import { useEffect, useState } from "react";
import { useAutumnContext } from "../AutumnContext";
import { AutumnClientError } from "../types";
import { AutumnError } from "../../../sdk";
import {
  Entity,
  GetEntityParams,
} from "../../../sdk/customers/entities/entTypes";
import { getEntityAction } from "../../server/cusActions";

export const useEntity = (entityId?: string, params?: GetEntityParams) => {
  const {
    encryptedCustomerId,
    entityId: contextEntityId,
    entity,
    setEntity,
  } = useAutumnContext();

  const finalEntityId = entityId || contextEntityId;
  const [error, setError] = useState<AutumnError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchEntity = async () => {
    if (!finalEntityId) {
      console.warn("(Autumn) No entity ID provided in useEntity hook");
      return;
    }

    setIsLoading(true);

    let returnData: Entity | null = null;
    try {
      let data: Entity | null = null;
      let error: AutumnError | null = null;

      const result = await getEntityAction({
        encryptedCustomerId,
        entityId: finalEntityId,
        params,
      });
      data = result.data;
      error = result.error;

      if (error) {
        console.log("(Autumn) Error fetching entity:", error);
        setError(error);
      } else {
        setEntity(data);
        setError(null);
      }
      returnData = data;
    } catch (error) {
      console.error("(Autumn) Error fetching entity:", error);
      setError(error as AutumnError);
    }
    setIsLoading(false);
    return returnData;
  };

  const refetch = async () => {
    await fetchEntity();
  };

  useEffect(() => {
    fetchEntity();
  }, [encryptedCustomerId, finalEntityId]);

  return { entity, isLoading, error, refetch };
};
