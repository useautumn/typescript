import type { AutumnPromise } from "@/utils/response";
import type { Entity } from "@useautumn/sdk/resources/shared";
import type { EntityDeleteResponse } from "@useautumn/sdk/resources/entities";
import { getEntityExpandStr } from "../../../utils/entityUtils";
import type { AutumnClient } from "./ReactAutumnClient";
import type {
  CreateEntityParams,
  GetEntityParams,
} from "./types/clientEntTypes";

export async function createEntityMethod(
  this: AutumnClient,
  params: CreateEntityParams | CreateEntityParams[]
): AutumnPromise<Entity | Entity[]> {
  const res = await this.post(`${this.prefix}/entities`, params);
  return res;
}

export async function getEntityMethod(
  this: AutumnClient,
  entityId: string,
  params?: GetEntityParams
): AutumnPromise<Entity> {
  const expand = getEntityExpandStr(params?.expand);
  const res = await this.get(`${this.prefix}/entities/${entityId}?${expand}`);

  return res;
}

export async function deleteEntityMethod(
  this: AutumnClient,
  entityId: string
): AutumnPromise<EntityDeleteResponse> {
  const res = await this.delete(`${this.prefix}/entities/${entityId}`);
  return res;
}
