import { AutumnError, type AutumnErrorWithStatus } from "@/utils/error";
import type { QueryResponse } from "@useautumn/sdk/resources/top-level";
import useSWR from "swr";
import { AutumnContext, useAutumnContext } from "@/AutumnContext";
import type { QueryParams } from "@/client/types/clientGenTypes";

/**
 * Query usage analytics data from your React components.
 *
 * The `useAnalytics` hook provides access to usage analytics and reporting data. It's the client-side equivalent of the `/query` endpoint, allowing you to fetch and display usage data directly in your React components.
 *
 * @param params.featureId - Feature ID(s) to query usage data for
 * @param params.range - Time range for analytics query. Defaults to '30d' (optional)
 *
 * @returns data - Array of usage data points with period timestamps and feature usage counts
 * @returns isLoading - Whether analytics data is being fetched
 * @returns error - Any error that occurred while fetching
 * @returns refetch - Manually refetch analytics data
 *
 * @see {@link https://docs.useautumn.com/api-reference/hooks/useAnalytics}
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

	const { data, error, mutate } = useSWR<QueryResponse, AutumnError>(
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
