import { Autumn } from "../../client";
import {
  CreateEntityParams,
  CreateEntityResult,
  DeleteEntityResult,
  Entity,
  GetEntityParams,
  TransferProductParams,
  TransferProductResult,
} from "./entTypes";
import { staticWrapper } from "../../utils";
import { AutumnPromise } from "../../response";

export const entityMethods = (instance?: Autumn) => {
  return {
    get: (customer_id: string, entity_id: string, params?: GetEntityParams) =>
      staticWrapper(getEntity, instance, {
        customer_id,
        entity_id,
        params,
      }),
    create: (
      customer_id: string,
      params?: CreateEntityParams | CreateEntityParams[]
    ) => staticWrapper(createEntity, instance, { customer_id, params }),
    transfer: (customer_id: string, params: TransferProductParams) =>
      staticWrapper(transferProduct, instance, { customer_id, params }),
    delete: (customer_id: string, entity_id: string) =>
      staticWrapper(deleteEntity, instance, { customer_id, entity_id }),
  };
};

export const getExpandStr = (expand?: string[]) => {
  if (!expand) {
    return "";
  }
  return `expand=${expand.join(",")}`;
};

export const getEntity = async ({
  instance,
  customer_id,
  entity_id,
  params,
}: {
  instance: Autumn;
  customer_id: string;
  entity_id: string;
  params?: GetEntityParams;
}): AutumnPromise<Entity> => {
  return instance.get(
    `/customers/${customer_id}/entities/${entity_id}?${getExpandStr(
      params?.expand
    )}`
  );
};

export const createEntity = async ({
  instance,
  customer_id,
  params,
}: {
  instance: Autumn;
  customer_id: string;
  params?: CreateEntityParams | CreateEntityParams[];
}): AutumnPromise<CreateEntityResult> => {
  return instance.post(`/customers/${customer_id}/entities`, params);
};

export const deleteEntity = async ({
  instance,
  customer_id,
  entity_id,
}: {
  instance: Autumn;
  customer_id: string;
  entity_id: string;
}): AutumnPromise<DeleteEntityResult> => {
  return instance.delete(`/customers/${customer_id}/entities/${entity_id}`);
};

export const transferProduct = async ({
  instance,
  customer_id,
  params,
}: {
  instance: Autumn;
  customer_id: string;
  params: TransferProductParams;
}): AutumnPromise<TransferProductResult> => {
  return instance.post(`/customers/${customer_id}/transfer`, params);
};