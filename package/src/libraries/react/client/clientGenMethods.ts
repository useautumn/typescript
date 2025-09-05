import { AutumnClient } from "./ReactAutumnClient";
import { toSnakeCase } from "../utils/toSnakeCase";
import {
  CancelParams,
  CheckParams,
  OpenBillingPortalParams,
  TrackParams,
  SetupPaymentParams,
  QueryParams,
} from "./types/clientGenTypes";
import {
  BillingPortalResult,
  CancelResult,
  CheckResult,
  SetupPaymentResult,
  TrackResult,
  AutumnPromise,
  QueryResult,
} from "@sdk";

import { AttachParams, CheckoutParams } from "./types/clientAttachTypes";
import { AttachResult, CheckoutResult } from "@sdk/general/attachTypes";

export async function checkoutMethod(
  this: AutumnClient,
  params: CheckoutParams
): AutumnPromise<CheckoutResult> {
  let snakeParams = toSnakeCase(params, ["checkoutSessionparams"]);
  const res = await this.post(`${this.prefix}/checkout`, snakeParams);
  return res;
}

export async function attachMethod(
  this: AutumnClient,
  params: AttachParams
): AutumnPromise<AttachResult> {
  let snakeParams = toSnakeCase(params, ["checkoutSessionparams"]);

  const res = await this.post(`${this.prefix}/attach`, snakeParams);
  return res;
}
export async function setupPaymentMethod(
  this: AutumnClient,
  params: SetupPaymentParams
): AutumnPromise<SetupPaymentResult> {
  let snakeParams = toSnakeCase(params, ["checkoutSessionParams"]);

  const res = await this.post(`${this.prefix}/setup_payment`, snakeParams);
  return res;
}

export async function cancelMethod(
  this: AutumnClient,
  params: CancelParams
): AutumnPromise<CancelResult> {
  let snakeParams = toSnakeCase(params);
  const res = await this.post(`${this.prefix}/cancel`, snakeParams);
  return res;
}

export async function checkMethod(
  this: AutumnClient,
  params: CheckParams
): AutumnPromise<CheckResult> {
  // Remove dialog from params
  let { dialog, ...rest } = params;
  let snakeParams = toSnakeCase(rest);

  const res = await this.post(`${this.prefix}/check`, snakeParams);
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
  let snakeParams = toSnakeCase(params, ["properties"]);
  const res = await this.post(`${this.prefix}/track`, snakeParams);
  return res;
}

export async function openBillingPortalMethod(
  this: AutumnClient,
  params?: OpenBillingPortalParams
): AutumnPromise<BillingPortalResult> {
  let snakeParams = toSnakeCase(params || {});

  const res = await this.post(`${this.prefix}/billing_portal`, snakeParams);
  return res;
}

export async function queryMethod(
  this: AutumnClient,
  params: QueryParams
): AutumnPromise<QueryResult> {
  let snakeParams = toSnakeCase(params);
  const res = await this.post(`${this.prefix}/query`, snakeParams);
  return res;
}
