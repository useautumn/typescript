import type { AutumnPromise } from "@sdk/response";
import { staticWrapper } from "@sdk/utils";
import type { Autumn } from "../client";
import type {
	EventLogResponse,
	LogParams,
	QueryParams,
	QueryResult,
} from "./eventTypes";

export const eventMethods = (instance?: Autumn) => {
	return {
		log: (params: LogParams) =>
			staticWrapper(handleEventLog, instance, { params }),
		aggregate: (params: QueryParams) =>
			staticWrapper(handleEventAggregate, instance, { params }),
	};
};

const handleEventLog = async ({
	instance,
	params,
}: {
	instance: Autumn;
	params: LogParams;
}): AutumnPromise<EventLogResponse> => {
	return instance.post("/events/log", params);
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
