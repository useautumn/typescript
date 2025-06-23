import { AutumnContext } from "../AutumnContext";
import { GetEntityParams } from "../client/types/clientEntTypes";
import { useEntityBase } from "./useEntityBase";

export const useEntity = (entityId: string, params?: GetEntityParams) => {
  return useEntityBase({ AutumnContext, entityId, params });
};
