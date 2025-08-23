import { Autumn } from "autumn-js";
import {
  camelToSnake,
  type CreateEntityArgsType,
  type DeleteEntityArgsType,
  type GetEntityArgsType,
} from "../../types.js";

export const create = async (args: CreateEntityArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.entities.create(camelToSnake(args));
  return res;
};

export const discard = async (args: DeleteEntityArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.entities.delete(args.customerId, args.entityId);
  return res;
};

export const get = async (args: GetEntityArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.entities.get(args.customerId, args.entityId, {
    expand: args.expand,
  });
  return res;
};
