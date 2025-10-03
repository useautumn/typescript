
import Autumn from "@sdk";
import { getEntityExpandStr } from "../../../utils/entityUtils";
import type { AutumnClient } from "./ReactAutumnClient";
// import type {
//   CreateEntityParams,
//   GetEntityParams,
// } from "./types/clientEntTypes";
import { EntityCreateParams, EntityGetParams } from "@/clientTypes";

export async function createEntityMethod(
  this: AutumnClient,
  params: EntityCreateParams
): Promise<Autumn.Entity> {
  const res = await this.post(`${this.prefix}/entities`, params);
  return res;
}

export async function getEntityMethod(
  this: AutumnClient,
  entityId: string,
  params?: EntityGetParams
): Promise<Autumn.Entity> {
  const expand = getEntityExpandStr(params?.expand as Array<string>);
  const res = await this.get(`${this.prefix}/entities/${entityId}?${expand}`);

  return res;
}

export async function deleteEntityMethod(
  this: AutumnClient,
  entityId: string
): Promise<Autumn.EntityDeleteResponse> {
  const res = await this.delete(`${this.prefix}/entities/${entityId}`);
  return res;
}
