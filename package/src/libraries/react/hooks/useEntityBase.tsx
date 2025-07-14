import useSWR from "swr";
import { GetEntityParams } from "../../../libraries/react/client/types/clientEntTypes";
import { useContext } from "react";
import { AutumnContextParams } from "../AutumnContext";
import { AllowedParams, handleAllowed } from "./handleAllowed";
import { useAutumnBase } from "./useAutumnBase";
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

  const {
    check: checkAutumn,
    attach: attachAutumn,
    cancel: cancelAutumn,
    track: trackAutumn,
  } = useAutumnBase({
    AutumnContext,
  });

  const allowed = (params: AllowedParams): boolean =>
    handleAllowed({ customer: data, params });

  const check = (params: CheckParams) =>
    checkAutumn({ ...params, entityId: entityId || undefined });
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
      allowed,
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
    allowed,
    check,
    attach,
    cancel,
    track,
  };
};
