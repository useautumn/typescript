import {
	AutumnError,
	type AutumnErrorWithStatus,
	type QueryResult,
} from "@sdk";
import useSWR from "swr";
import { AutumnContext, useAutumnContext } from "@/AutumnContext";
import type { QueryParams } from "@/client/types/clientGenTypes";

/**
 * @deprecated Use useAggregateEvents or useListEvents instead
 */
export const useAnalytics = (params: QueryParams) => {
	const context = useAutumnContext({
		AutumnContext,
		name: "useAnalytics",
	});

	const client = context.client;

	const fetcher = async () => {
		const res = await client.query(params);
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

	const { data, error, mutate } = useSWR<QueryResult, AutumnError>(
		["analytics", params.featureId, params.range],
		fetcher,
		{
			refreshInterval: 0,
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			shouldRetryOnError: (error) =>
				(error as AutumnErrorWithStatus).statusCode === 429,
			errorRetryCount: 3,
		},
	);

	return {
		data: data?.list,
		isLoading: !error && !data,
		error,
		refetch: mutate,
	};
};
