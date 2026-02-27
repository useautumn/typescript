import { AutumnContext } from "../AutumnContext";
import { GetEntityParams } from "../client/types/clientEntTypes";
import { useEntityBase } from "./useEntityBase";

export const useEntity = (
  entityId: string | null,
  params?: GetEntityParams & {
    /** Extra key(s) appended to the SWR query key that trigger a refetch when any value changes. */
    extraQueryKeys?: (string | null | undefined)[];
  }
) => {
  const { extraQueryKeys, ...restParams } = params ?? {};
  return useEntityBase({ AutumnContext, entityId, params: restParams, extraQueryKeys });
};
