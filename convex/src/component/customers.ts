import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { Autumn } from "autumn-js";
import { 
  GetCustomerArgs, 
  UpdateCustomerArgs, 
  DeleteCustomerArgs, 
  BillingPortalArgs,
  camelToSnake 
} from "../types.js";

export const get = action({
  args: GetCustomerArgs,
  handler: async (ctx, args) => {
    const autumn = new Autumn({
      secretKey: args.apiKey,
    });
    let res = await autumn.customers.get(args.customerId, {
      expand: args.expand,
    });
    return res;
  },
});

export const update = action({
  args: UpdateCustomerArgs,
  handler: async (ctx, args) => {
    const autumn = new Autumn({
      secretKey: args.apiKey,
    });
    let res = await autumn.customers.update(args.customerId, {
      name: args.name,
      email: args.email,
    });
    return res;
  },
});

export const discard = action({
  args: DeleteCustomerArgs,
  handler: async (ctx, args) => {
    const autumn = new Autumn({
      secretKey: args.apiKey,
    });
    let res = await autumn.customers.delete(args.customerId);
    return res;
  },
});

export const billingPortal = action({
  args: BillingPortalArgs,
  handler: async (ctx, args) => {
    const autumn = new Autumn({
      secretKey: args.apiKey,
    });
    let res = await autumn.customers.billingPortal(args.customerId, {
      return_url: args.returnUrl,
    });
    return res;
  },
});