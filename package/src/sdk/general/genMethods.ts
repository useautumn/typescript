import { Autumn } from "../client";
import { AutumnError } from "../error";
import {
  AttachParams,
  AttachResult,
  EntitledParams,
  EntitledResult,
  EventParams,
  EventResult,
  UsageParams,
  UsageResult,
} from "./genTypes";

export const handleAttach = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: AttachParams;
}): Promise<{
  data: AttachResult | null;
  error: AutumnError | null;
}> => {
  return instance.post("/attach", params);
};

export const handleEntitled = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: EntitledParams;
}): Promise<{
  data: EntitledResult | null;
  error: AutumnError | null;
}> => {
  return instance.post("/entitled", params);
};

export const handleEvent = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: EventParams;
}): Promise<{
  data: EventResult | null;
  error: AutumnError | null;
}> => {
  return instance.post("/events", params);
};

export const handleUsage = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: UsageParams;
}): Promise<{
  data: UsageResult | null;
  error: AutumnError | null;
}> => {
  return instance.post("/usage", params);
};
