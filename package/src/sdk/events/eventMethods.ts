import type { AutumnPromise } from "@sdk/response";
import type { Autumn } from "../client";
import type { QueryParams, QueryResult } from "./eventTypes";
import { staticWrapper } from "@sdk/utils";

export const eventMethods = (instance?: Autumn) => {
  return {
    aggregate: (params: QueryParams) => staticWrapper(handleEventAggregate, instance, { params }),
  };
};

const handleEventAggregate = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: QueryParams;
}): AutumnPromise<QueryResult> => {
  
  return instance.post("/events/aggregate", params);
};