import { Autumn } from "../client";
import { AutumnError } from "../error";
import { AutumnPromise } from "../response";
import {
  AttachParams,
  AttachResult,
  CheckParams,
  CheckResult,
  TrackParams,
  TrackResult,
  UsageParams,
  UsageResult,
} from "./genTypes";

export const handleAttach = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: AttachParams;
}): AutumnPromise<AttachResult> => {
  return instance.post("/attach", params);
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
