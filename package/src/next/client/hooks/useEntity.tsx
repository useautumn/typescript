import { GetEntityParams } from "../../../sdk/customers/entities/entTypes";
import { useEntityBase } from "../../../libraries/react/hooks/useEntityBase";
import { AutumnContext } from "../../../libraries/react/AutumnContext";

export const useEntity = (entityId: string | null, params?: GetEntityParams) => {
  return useEntityBase({ AutumnContext, entityId, params });
};
