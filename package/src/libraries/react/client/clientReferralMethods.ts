import type { AutumnPromise } from "@/utils/response";
import type {
  ReferralCreateCodeResponse,
  ReferralRedeemCodeResponse,
} from "@useautumn/sdk/resources/referrals";
import type { AutumnClient } from "./ReactAutumnClient";
import type {
  CreateReferralCodeParams,
  RedeemReferralCodeParams,
} from "./types/clientReferralTypes";

export async function createCode(
  this: AutumnClient,
  params: CreateReferralCodeParams
): AutumnPromise<ReferralCreateCodeResponse> {
  const res = await this.post(`${this.prefix}/referrals/code`, params);
  return res;
}

export async function redeemCode(
  this: AutumnClient,
  params: RedeemReferralCodeParams
): AutumnPromise<ReferralRedeemCodeResponse> {
  const res = await this.post(`${this.prefix}/referrals/redeem`, params);
  return res;
}
