import { Autumn } from "../client";

import { AutumnPromise } from "../response";
import {
  AttachParams,
  AttachResult,
  CheckoutParams,
  CheckoutResult,
} from "./attachTypes";
import {
  CancelParams,
  CancelResult,
  CheckParams,
  CheckResult,
  QueryParams,
  QueryResult,
  SetupPaymentParams,
  SetupPaymentResult,
  TrackParams,
  TrackResult,
  UsageParams,
  UsageResult,
} from "./genTypes";

export const handleCheckout = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: CheckoutParams;
}): AutumnPromise<CheckoutResult> => {
  return instance.post("/checkout", params);
};

export const handleAttach = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: AttachParams;
}): AutumnPromise<AttachResult> => {
  return instance.post("/attach", params);
};

export const handleSetupPayment = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: SetupPaymentParams;
}): AutumnPromise<SetupPaymentResult> => {
  return instance.post("/setup_payment", params);
};

export const handleCancel = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: CancelParams;
}): AutumnPromise<CancelResult> => {
  return instance.post("/cancel", params);
};

export const handleEntitled = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: CheckParams;
}): AutumnPromise<CheckResult> => {
  return instance.post("/entitled", params);
};

export const handleEvent = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: TrackParams;
}): AutumnPromise<TrackResult> => {
  return instance.post("/events", params);
};

export const handleTrack = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: TrackParams;
}): AutumnPromise<TrackResult> => {
  return instance.post("/track", params);
};

export const handleUsage = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: UsageParams;
}): AutumnPromise<UsageResult> => {
  return instance.post("/usage", params);
};

export const handleCheck = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: CheckParams;
}): AutumnPromise<CheckResult> => {
  return instance.post("/check", params);
};

export const handleQuery = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: QueryParams;
}): AutumnPromise<QueryResult> => {
  return instance.post("/query", params);
};
