import type { Autumn, CreateEntityParams } from "autumn-js";
import type {
  IdentifierOptsType,
  CreateEntityArgsType,
  GetEntityArgsType,
} from "../../types.js";
import { wrapSdkCall } from "./utils.js";
import { toSnakeCase } from "../../utils.js";

export const create = async ({
  autumn,
  identifierOpts,
  args,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
  args: CreateEntityArgsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.entities.create(
      identifierOpts.customerId,
      toSnakeCase({ obj: args }) as unknown as CreateEntityParams
    )
  );
};

export const discard = async ({
  autumn,
  identifierOpts,
  entityId,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
  entityId: string;
}) => {
  return await wrapSdkCall(() =>
    autumn.entities.delete(identifierOpts.customerId, entityId)
  );
};

export const get = async ({
  autumn,
  identifierOpts,
  args,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
  args: GetEntityArgsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.entities.get(identifierOpts.customerId, args.entityId, {
      expand: args.expand,
    })
  );
};
