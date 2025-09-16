import { toSnakeCase } from "@utils/toSnakeCase";
import type {
  AutumnPromise,
  CreateReferralCodeResult,
  RedeemReferralCodeResult,
} from "../../../sdk";
import type { AutumnClient } from "./ReactAutumnClient";
import type {
  CreateReferralCodeParams,
  RedeemReferralCodeParams,
} from "./types/clientReferralTypes";

export async function createCode(
  this: AutumnClient,
  params: CreateReferralCodeParams
): AutumnPromise<CreateReferralCodeResult> {
  const res = await this.post(`${this.prefix}/referrals/code`, params);
  return res;
}

export async function redeemCode(
  this: AutumnClient,
  params: RedeemReferralCodeParams
): AutumnPromise<RedeemReferralCodeResult> {
  const res = await this.post(`${this.prefix}/referrals/redeem`, params);
  return res;
}
