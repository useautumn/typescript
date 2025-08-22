import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { Autumn } from "autumn-js";
import { 
  GetProductArgs, 
  ListProductsArgs,
  camelToSnake 
} from "../types.js";

export const get = action({
  args: GetProductArgs,
  handler: async (ctx, args) => {
    const autumn = new Autumn({
      secretKey: args.apiKey,
    });
    let res = await autumn.products.get(args.productId);
    return res;
  },
});

export const list = action({
  args: ListProductsArgs,
  handler: async (ctx, args) => {
    const autumn = new Autumn({
      secretKey: args.apiKey,
    });
    let res = await autumn.products.list({
      customer_id: args.customerId,
    });
    return res;
  },
});