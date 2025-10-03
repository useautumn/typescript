import type {
  AutumnPromise,
  BillingPortalResult,
  CancelResult,
  CheckResult,
  QueryResult,
  SetupPaymentResult,
  TrackResult,
} from "@sdk";
import type { AttachResult, CheckoutResult } from "@sdk/general/attachTypes";
import type { AutumnClient } from "./ReactAutumnClient";

import type { AttachParams, CheckoutParams } from "./types/clientAttachTypes";
import type {
  CancelParams,
  CheckParams,
  OpenBillingPortalParams,
  QueryParams,
  SetupPaymentParams,
  TrackParams,
} from "./types/clientGenTypes";

export async function checkoutMethod(
  this: AutumnClient,
  params: CheckoutParams
): AutumnPromise<CheckoutResult> {
  const res = await this.post(`${this.prefix}/checkout`, params);
  return res;
}

export async function attachMethod(
  this: AutumnClient,
  params: AttachParams
): AutumnPromise<AttachResult> {
  const res = await this.post(`${this.prefix}/attach`, params);
  return res;
}
export async function setupPaymentMethod(
  this: AutumnClient,
  params: SetupPaymentParams
): AutumnPromise<SetupPaymentResult> {
  const res = await this.post(`${this.prefix}/setup_payment`, params);
  return res;
}

export async function cancelMethod(
  this: AutumnClient,
  params: CancelParams
): AutumnPromise<CancelResult> {
  const res = await this.post(`${this.prefix}/cancel`, params);
  return res;
}

export async function checkMethod(
  this: AutumnClient,
  params: CheckParams
): AutumnPromise<CheckResult> {
  // Remove dialog from params
  const noDialogParams = {
    ...params,
    dialog: undefined,
  };

  const res = await this.post(`${this.prefix}/check`, noDialogParams);
  return res;
}

export async function trackMethod(
  this: AutumnClient,
  params: TrackParams
): AutumnPromise<TrackResult> {
  const res = await this.post(`${this.prefix}/track`, params);
  return res;
}

export async function openBillingPortalMethod(
  this: AutumnClient,
  params?: OpenBillingPortalParams
): AutumnPromise<BillingPortalResult> {
  const res = await this.post(`${this.prefix}/billing_portal`, params || {});
  return res;
}

export async function queryMethod(
  this: AutumnClient,
  params: QueryParams
): AutumnPromise<QueryResult> {
  const res = await this.post(`${this.prefix}/query`, params);
  return res;
}
