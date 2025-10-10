import { AutumnContext, useAutumnContext } from "@/AutumnContext";
import { QueryParams } from "@/clientTypes";
import Autumn from "@sdk";
import useSWR from "swr";

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
    const data = await client.query(params);

    return data?.list || [];
  };

  const { data, error, mutate } = useSWR<Autumn.QueryResponse["list"]>(
    ["analytics", params.featureId, params.range],
    fetcher,
    { refreshInterval: 0 }
  );

  return {
    data: data,
    isLoading: !error && !data,
    error,
    refetch: mutate,
  };
};
