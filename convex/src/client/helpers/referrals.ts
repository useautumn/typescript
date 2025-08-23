
import { Autumn } from "autumn-js";
import { 
  type CreateReferralCodeArgsType, 
  type RedeemReferralCodeArgsType,
} from "../../types.js";

export const createCode = async (args: CreateReferralCodeArgsType) => {
    const autumn = new Autumn({
      secretKey: args.apiKey,
    });
    let res = await autumn.referrals.createCode({
      customer_id: args.customerId,
      program_id: args.programId,
    });
    return res;
};

export const redeemCode = async (args: RedeemReferralCodeArgsType) => {
    const autumn = new Autumn({
      secretKey: args.apiKey,
    });
    let res = await autumn.referrals.redeemCode({
      customer_id: args.customerId,
      code: args.code,
    });
    return res;
};