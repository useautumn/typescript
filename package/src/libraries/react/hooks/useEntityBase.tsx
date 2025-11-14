import useSWR from "swr";
import { GetEntityParams } from "../../../libraries/react/client/types/clientEntTypes";
import { useContext } from "react";
import { AutumnContextParams, useAutumnContext } from "../AutumnContext";
import { AllowedParams, handleCheck, openDialog } from "./helpers/handleCheck";
import { useAutumnBase } from "./helpers/useAutumnBase";
import {
  CancelParams,
  CheckParams,
  TrackParams,
} from "@/client/types/clientGenTypes";
import { AttachParams } from "@/client/types/clientAttachTypes";

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

  const context = useAutumnContext({
    AutumnContext,
    name: "useEntity",
    entityId,
  });

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
    shouldRetryOnError: false,
    onErrorRetry: (error: any, key: any, config: any) => {
      if (error.code == "entity_not_found") {
        return false;
      }

      return true;
    },
  });

  const {
    attach: attachAutumn,
    cancel: cancelAutumn,
    track: trackAutumn,
  } = useAutumnBase({ context, client });

  const check = (params: CheckParams) => {
    const result = handleCheck({ customer: data, params, isEntity: true });

    openDialog({
      result: result.data,
      params,
      context: context!,
    });

    return result;
  };

  const attach = (params: AttachParams) =>
    attachAutumn({ ...params, entityId: entityId || undefined });
  const cancel = (params: CancelParams) =>
    cancelAutumn({ ...params, entityId: entityId || undefined });
  const track = (params: TrackParams) =>
    trackAutumn({ ...params, entityId: entityId || undefined });

  if (!entityId) {
    return {
      entity: null,
      isLoading: false,
      error: null,
      refetch: mutate,
      check,
      attach,
      cancel,
      track,
    };
  }

  return {
    entity: error ? null : data,
    isLoading,
    error,
    refetch: mutate,
    check,
    attach,
    cancel,
    track,
  };
};
