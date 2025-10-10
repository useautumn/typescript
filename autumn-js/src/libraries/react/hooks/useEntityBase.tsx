import useSWR from "swr";
import { useContext } from "react";
import type { Autumn, AutumnError } from "@sdk";
import { AutumnContextParams, useAutumnContext } from "../AutumnContext";
import { handleCheck, openDialog } from "./helpers/handleCheck";
import { useAutumnBase } from "./helpers/useAutumnBase";
import {
  EntityGetParams,
  CancelParams,
  CheckParams,
  TrackParams,
  AttachParams,
} from "@/clientTypes";
import type { UseEntityMethods } from "./types/useEntityMethods";

export interface UseEntityResult extends UseEntityMethods {
	/** The entity object containing all entity data */
	entity: Autumn.Entity | null;

	/** Whether entity data is currently being loaded */
	isLoading: boolean;

	/** Any error that occurred while fetching entity data */
	error: AutumnError | null;

	/** Refetches the entity data from the server */
	refetch: () => Promise<Autumn.Entity | null>;

	// All hook methods (attach, cancel, track, check) are inherited from UseEntityMethods
}

export const useEntityBase = ({
  entityId,
  params,
  AutumnContext,
}: {
  entityId: string | null;
  params?: EntityGetParams;
  AutumnContext: React.Context<AutumnContextParams>;
}): UseEntityResult => {
  const { client } = useContext(AutumnContext);
  const queryKey = ["entity", entityId, params?.expand];

  const context = useAutumnContext({
    AutumnContext,
    name: "useEntity",
  });

  const fetchEntity = async () => {
    if (!entityId) {
      return null;
    }

    
    return await client.entities.get(entityId, params);
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
      result: result,
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

  const refetch = async () => {
    const result = await mutate();
    return result ?? null;
  };

  if (!entityId) {
    return {
      entity: null,
      isLoading: false,
      error: null,
      refetch,
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
    refetch,
    check,
    attach,
    cancel,
    track,
  };
};
