import type { Autumn, LogParams, QueryParams } from "autumn-js";
import { wrapSdkCall } from "./utils.js";
import type {
	EventListArgsType,
	EventAggregateArgsType,
} from "../../types.js";
import { toSnakeCase } from "../../utils.js";

export const list = async ({
	autumn,
	args,
}: {
	autumn: Autumn;
	args: EventListArgsType;
}) => {
	return await wrapSdkCall(() =>
		autumn.events.list(
			toSnakeCase({
				obj: args,
			}) as unknown as LogParams,
		),
	);
};

export const aggregate = async ({
	autumn,
	args,
}: {
	autumn: Autumn;
	args: EventAggregateArgsType;
}) => {
	return await wrapSdkCall(() =>
		autumn.events.aggregate(
			toSnakeCase({
				obj: args,
			}) as unknown as QueryParams,
		),
	);
};
