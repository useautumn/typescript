import { AutumnContext } from "../AutumnContext";
import { EntityGetParams } from "@/clientTypes";
import { useEntityBase } from "./useEntityBase";

/**
 * Access an entity's state and use it to display information in your React app.
 *
 * The `useEntity` hook provides access to entity data and related operations. You can use it from your frontend to retrieve entity information and manage loading states.
 *
 * @param entityId - The ID of the entity to retrieve
 * @param params.expand - Additional data to include in entity response (optional)
 *
 * @returns data - Entity object with subscription and feature data
 * @returns isLoading - Whether entity data is being fetched
 * @returns error - Any error that occurred while fetching
 * @returns refetch - Refetch entity data
 * @returns ...methods - Entity-scoped methods (attach, cancel, track, check)
 *
 * @see {@link https://docs.useautumn.com/api-reference/hooks/useEntity}
 */
export const useEntity = (
  entityId: string | null,
  params?: EntityGetParams
) => {
  return useEntityBase({ AutumnContext, entityId, params });
};
