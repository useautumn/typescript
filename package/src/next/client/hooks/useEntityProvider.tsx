import useSWR from "swr";
import { GetEntityParams } from "../../../libraries/react/client/types/clientEntTypes";
import { getEntityAction } from "../../../next/server/cusActions";
import { useAutumnContext } from "../AutumnContext";

export const useEntityProvider = (
  entityId?: string,
  params?: GetEntityParams
) => {
  const { encryptedCustomerId } = useAutumnContext();
  const queryKey = ["entity", entityId, params?.expand];

  const fetchEntity = async () => {
    if (!entityId) {
      return;
    }

    const { data, error } = await getEntityAction({
      encryptedCustomerId,
      entityId,
      params,
    });

    if (error) {
      throw error;
    }

    return data;
  };

  const { data, error, isLoading, mutate } = useSWR(queryKey, fetchEntity);

  return {
    entity: data,
    isLoading,
    error,
    refetch: mutate,
  };
};
