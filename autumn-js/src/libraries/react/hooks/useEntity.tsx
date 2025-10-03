import { AutumnContext } from "../AutumnContext";
import { EntityGetParams } from "@/clientTypes";
import { useEntityBase } from "./useEntityBase";

export const useEntity = (
  entityId: string | null,
  params?: EntityGetParams
) => {
  return useEntityBase({ AutumnContext, entityId, params });
};
