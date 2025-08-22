import { v } from "convex/values";
import { action } from "./_generated/server.js";
import { Autumn } from "autumn-js";
import { 
  CreateReferralCodeArgs, 
  RedeemReferralCodeArgs,
  camelToSnake 
} from "../types.js";

export const createCode = action({
  args: CreateReferralCodeArgs,
  handler: async (ctx, args) => {
    const autumn = new Autumn({
      secretKey: args.apiKey,
    });
    let res = await autumn.referrals.createCode({
      customer_id: args.customerId,
      program_id: args.programId,
    });
    return res;
  },
});

export const redeemCode = action({
  args: RedeemReferralCodeArgs,
  handler: async (ctx, args) => {
    const autumn = new Autumn({
      secretKey: args.apiKey,
    });
    let res = await autumn.referrals.redeemCode({
      customer_id: args.customerId,
      code: args.code,
    });
    return res;
  },
});