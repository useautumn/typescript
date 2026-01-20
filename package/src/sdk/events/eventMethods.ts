import type { Autumn } from "../client";
import type { AutumnPromise } from "../response";
import { staticWrapper } from "../utils";
import type {
	EventsListParams,
	EventsListResponse,
	QueryParams,
	QueryResult,
} from "./eventTypes";

export const eventMethods = (instance?: Autumn) => {
	return {
		list: (params: EventsListParams) =>
			staticWrapper(handleEventList, instance, { params }),
		aggregate: (params: QueryParams) =>
			staticWrapper(handleEventAggregate, instance, { params }),
	};
};

const handleEventList = async ({
	instance,
	params,
}: {
	instance: Autumn;
	params: EventsListParams;
}): AutumnPromise<EventsListResponse> => {
	return instance.post("/events/list", params);
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
