import type { AutumnPromise } from "../../../sdk";
import type { EventsListResponse } from "../../../sdk/events/eventTypes";
import type { AutumnClient } from "./ReactAutumnClient";
import type {
	EventAggregationParams,
	EventAggregationResponse,
	EventsListParams,
} from "./types/clientAnalyticsTypes";

export async function eventListMethod(
	this: AutumnClient,
	params: EventsListParams,
): AutumnPromise<EventsListResponse> {
	const res = await this.post(`${this.prefix}/events/list`, params);
	console.log("res", res);
	return res;
}

export async function eventAggregateMethod(
	this: AutumnClient,
	params: EventAggregationParams,
): AutumnPromise<EventAggregationResponse> {
	const res = await this.post(`${this.prefix}/events/aggregate`, params);
	return res;
}
