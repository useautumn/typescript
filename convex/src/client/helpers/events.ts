import type { Autumn, EventsListParams, QueryParams } from "autumn-js";
import { wrapSdkCall } from "./utils.js";
import { toSnakeCase } from "../../utils.js";
import { EventAggregateArgsType, EventListArgsType, IdentifierOptsType } from "../../types.js";

export const list = async ({
	autumn,
	identifierOpts,
	args,
}: {
	autumn: Autumn;
	identifierOpts: IdentifierOptsType;
	args: EventListArgsType;
}) => {
	return await wrapSdkCall(() =>
		autumn.events.list(
			toSnakeCase({
				obj: {
					customer_id: identifierOpts.customerId,
					...args,
				},
			}) as unknown as EventsListParams,
		),
	);
};

export const aggregate = async ({
	autumn,
	identifierOpts,
	args,
}: {
	autumn: Autumn;
	identifierOpts: IdentifierOptsType;
	args: EventAggregateArgsType;
}) => {
	return await wrapSdkCall(() =>
		autumn.events.aggregate(
			toSnakeCase({
				obj: {
					customer_id: identifierOpts.customerId,
					...args,
				},
			}) as unknown as QueryParams,
		),
	);
};
