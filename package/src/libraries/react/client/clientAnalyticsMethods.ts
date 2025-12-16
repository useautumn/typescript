import { AutumnClient } from "./ReactAutumnClient";
import { AutumnPromise } from "../../../sdk";
import type {
  EventListParams,
  EventListResponse,
  EventAggregationParams,
  EventAggregationResponse,
} from "./types/clientAnalyticsTypes";

export async function eventListMethod(
  this: AutumnClient,
  params: EventListParams,
): AutumnPromise<EventListResponse> {
  const res = await this.post(`${this.prefix}/events/list`, params);
  return res;
}

export async function eventAggregateMethod(
  this: AutumnClient,
  params: EventAggregationParams,
): AutumnPromise<EventAggregationResponse> {
  const res = await this.post(`${this.prefix}/events/aggregate`, params);
  return res;
}
