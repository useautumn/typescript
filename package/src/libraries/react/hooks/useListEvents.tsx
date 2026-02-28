import { AutumnContext, useAutumnContext } from "@/AutumnContext";
import type { EventsListParams } from "@/client/types/clientAnalyticsTypes";
import {
	AutumnError,
	type AutumnErrorWithStatus,
	type EventsListResponse,
} from "@sdk";
import { useCallback, useState } from "react";
import useSWR, { type SWRConfiguration } from "swr";

export const useListEvents = ({
	swrConfig,
	extraQueryKeys,
	...params
}: EventsListParams & {
	swrConfig?: SWRConfiguration;
	/** Extra key(s) appended to the SWR query key that trigger a refetch when any value changes. */
	extraQueryKeys?: (string | null | undefined)[];
}) => {
	const context = useAutumnContext({
		AutumnContext,
		name: "useListEvents",
	});

	const client = context.client;
	const limit = params.limit ?? 100;
	const [page, setPage] = useState(0);

	const startDate = params.customRange?.start
		? new Date(params.customRange.start).toISOString().slice(0, 13)
		: undefined;

	const endDate = params.customRange?.end
		? new Date(params.customRange.end).toISOString().slice(0, 13)
		: undefined;

	const offset = page * limit;

	const fetcher = async () => {
		const res = await client.events.list({
			...params,
			offset,
			limit,
		});

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

	const { data, error, mutate, isLoading } = useSWR<
		EventsListResponse,
		AutumnError
	>(
		[
			"eventList",
			params.featureId,
			startDate,
			endDate,
			offset,
			limit,
			...(extraQueryKeys ?? []),
		],
		fetcher,
		{
			dedupingInterval: 2000,
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			shouldRetryOnError: (error) =>
				(error as AutumnErrorWithStatus).statusCode === 429,
			errorRetryCount: 3,
			refreshInterval: 0,
			...swrConfig,
		},
	);

	const hasMore = data?.has_more ?? false;
	const hasPrevious = page > 0;

	const nextPage = useCallback(() => {
		if (hasMore) {
			setPage((p) => p + 1);
		}
	}, [hasMore]);

	const prevPage = useCallback(() => {
		if (hasPrevious) {
			setPage((p) => p - 1);
		}
	}, [hasPrevious]);

	const goToPage = useCallback((pageNum: number) => {
		setPage(Math.max(0, pageNum));
	}, []);

	const resetPagination = useCallback(() => {
		setPage(0);
	}, []);

	return {
		list: data?.list,
		hasMore,
		hasPrevious,
		page,
		isLoading,
		error,
		refetch: mutate,
		nextPage,
		prevPage,
		goToPage,
		resetPagination,
	};
};
