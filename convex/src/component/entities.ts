import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { Autumn } from "autumn-js";
import { camelToSnake, CreateEntityArgs, DeleteEntityArgs, GetEntityArgs } from "../types.js";

export const create = action({
  args: CreateEntityArgs,
  handler: async (ctx, args) => {
    const autumn = new Autumn({
      secretKey: args.apiKey,
    });
    let res = await autumn.entities.create(camelToSnake(args));
    return res;
  },
});

export const discard = action({
  args: DeleteEntityArgs,
  handler: async (ctx, args) => {
    const autumn = new Autumn({
      secretKey: args.apiKey,
    });
    let res = await autumn.entities.delete(args.customerId, args.entityId);
    return res;
  },
});

export const get = action({
  args: GetEntityArgs,
  handler: async (ctx, args) => {
    const autumn = new Autumn({
      secretKey: args.apiKey,
    });
    let res = await autumn.entities.get(args.customerId, args.entityId, {
      expand: args.expand,
    });
    return res;
  },
});