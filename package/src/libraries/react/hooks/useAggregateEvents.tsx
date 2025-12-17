import { AutumnError, type AutumnErrorWithStatus } from "@sdk";
import useSWR, { type SWRConfiguration } from "swr";
import { AutumnContext, useAutumnContext } from "@/AutumnContext";
import type {
	EventAggregationParams,
	EventAggregationResponse,
} from "@/client/types/clientAnalyticsTypes";

export const useAggregateEvents = (
	params: EventAggregationParams & { swrConfig?: SWRConfiguration },
) => {
	const context = useAutumnContext({
		AutumnContext,
		name: "useAggregateEvents",
	});

	const client = context.client;

	const fetcher = async () => {
		const res = await client.events.aggregate(params);
		if (res.error) {
			const err: AutumnErrorWithStatus = new AutumnError({
				message: res.error.message,
				code: res.error.code,
			});
			err.statusCode = res.statusCode;
			throw err;
		}
		return res.data;
	};

	const startDate = params.customRange?.start
		? new Date(params.customRange.start).toISOString().slice(0, 13)
		: undefined;

	const endDate = params.customRange?.end
		? new Date(params.customRange.end).toISOString().slice(0, 13)
		: undefined;

	const { data, error, mutate } = useSWR<EventAggregationResponse, AutumnError>(
		[
			"eventAggregate",
			params.featureId,
			params.groupBy,
			params.range,
			startDate,
			endDate,
			params.binSize,
		],
		fetcher,
		{
			dedupingInterval: 2000,
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			shouldRetryOnError: (error) =>
				(error as AutumnErrorWithStatus).statusCode === 429,
			errorRetryCount: 3,
			...params.swrConfig,
		},
	);

	return {
		list: data?.list,
		total: data?.total,

		isLoading: !error && !data,
		error,
		refetch: mutate,
	};
};
