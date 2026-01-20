import type { AutumnPromise } from "@/utils/response";
import type { EventListResponse, EventAggregateResponse } from "@useautumn/sdk/resources/events";
import type { AutumnClient } from "./ReactAutumnClient";
import type {
	EventAggregationParams,
	EventsListParams,
} from "./types/clientAnalyticsTypes";

export async function eventListMethod(
	this: AutumnClient,
	params: EventsListParams,
): AutumnPromise<EventListResponse> {
	const res = await this.post(`${this.prefix}/events/list`, params);

	return res;
}

export async function eventAggregateMethod(
	this: AutumnClient,
	params: EventAggregationParams,
): AutumnPromise<EventAggregateResponse> {
	const res = await this.post(`${this.prefix}/events/aggregate`, params);
	return res;
}
