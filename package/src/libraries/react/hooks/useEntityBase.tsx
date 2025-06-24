import useSWR from "swr";
import { GetEntityParams } from "../../../libraries/react/client/types/clientEntTypes";
import { useContext } from "react";
import { AutumnContextParams } from "../AutumnContext";

export const useEntityBase = ({
  entityId,
  params,
  AutumnContext,
}: {
  entityId: string | null;
  params?: GetEntityParams;
  AutumnContext: React.Context<AutumnContextParams>;
}) => {
  const { client } = useContext(AutumnContext);
  const queryKey = ["entity", entityId, params?.expand];

  const fetchEntity = async () => {
    if (!entityId) {
      return null;
    }

    const { data, error } = await client.entities.get(entityId, params);

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return data;
  };

  const { data, error, isLoading, mutate } = useSWR(queryKey, fetchEntity, {
    fallbackData: null,
    onErrorRetry: (error: any, key: any, config: any) => {
      if (error.code == "entity_not_found") {
        return false;
      }

      return true;
    },
  });

  if (!entityId) {
    return {
      entity: null,
      isLoading: false,
      error: null,
      refetch: mutate,
    };
  }

  return {
    entity: error ? null : data,
    isLoading,
    error,
    refetch: mutate,
  };
};
