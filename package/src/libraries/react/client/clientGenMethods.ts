import { AutumnClient } from "./ReactAutumnClient";
import { toSnakeCase } from "../utils/toSnakeCase";
import {
  AttachParams,
  CancelParams,
  CheckParams,
  OpenBillingPortalParams,
  TrackParams,
  SetupPaymentParams,
} from "./types/clientGenTypes";
import {
  AttachResult,
  BillingPortalResult,
  CancelResult,
  CheckFeatureResult,
  CheckProductResult,
  CheckResult,
  SetupPaymentResult,
  TrackResult,
} from "../../../sdk";
import { AutumnPromise } from "../../../sdk/response";

export async function attachMethod(
  this: AutumnClient,
  params: AttachParams
): AutumnPromise<AttachResult> {
  let { dialog, ...rest } = params;

  let snakeParams = toSnakeCase(rest, ["checkoutSessionparams"]);

  const res = await this.post("/api/autumn/attach", snakeParams);
  return res;
}
export async function setupPaymentMethod(
  this: AutumnClient,
  params: SetupPaymentParams
): AutumnPromise<SetupPaymentResult> {
  let snakeParams = toSnakeCase(params, ["checkoutSessionParams"]);

  const res = await this.post("/api/autumn/setup_payment", snakeParams);
  return res;
}

export async function cancelMethod(
  this: AutumnClient,
  params: CancelParams
): AutumnPromise<CancelResult> {
  let snakeParams = toSnakeCase(params);
  const res = await this.post("/api/autumn/cancel", snakeParams);
  return res;
}

export async function checkMethod(
  this: AutumnClient,
  params: CheckParams
): AutumnPromise<CheckResult> {
  // Remove dialog from params
  let { dialog, ...rest } = params;
  let snakeParams = toSnakeCase(rest);

  const res = await this.post("/api/autumn/check", snakeParams);
  return res;

  // if (params.featureId) {
  //   return res as AutumnPromise<CheckFeatureResult>;
  // } else {
  //   return res as AutumnPromise<CheckProductResult>;
  // }
}

export async function trackMethod(
  this: AutumnClient,
  params: TrackParams
): AutumnPromise<TrackResult> {
  let snakeParams = toSnakeCase(params);
  const res = await this.post("/api/autumn/track", snakeParams);
  return res;
}

export async function openBillingPortalMethod(
  this: AutumnClient,
  params?: OpenBillingPortalParams
): AutumnPromise<BillingPortalResult> {
  let snakeParams = toSnakeCase(params || {});

  const res = await this.post("/api/autumn/billing_portal", snakeParams);
  return res;
}
