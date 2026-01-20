import type { Autumn } from "../client";
import type { AutumnPromise } from "../response";
import { staticWrapper } from "../utils";
import type {
  CreateReferralCodeParams,
  CreateReferralCodeResult,
  RedeemReferralCodeParams,
  RedeemReferralCodeResult,
} from "./referralTypes";

export const referralMethods = (instance?: Autumn) => {
  return {
    createCode: (params: CreateReferralCodeParams) =>
      staticWrapper(createReferralCode, instance, { params }),
    redeemCode: (params: RedeemReferralCodeParams) =>
      staticWrapper(redeemReferralCode, instance, { params }),
  };
};

export const createReferralCode = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: CreateReferralCodeParams;
}): AutumnPromise<CreateReferralCodeResult> => {
  return instance.post("/referrals/code", params);
};

export const redeemReferralCode = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: RedeemReferralCodeParams;
}): AutumnPromise<RedeemReferralCodeResult> => {
  return instance.post("/referrals/redeem", params);
};
