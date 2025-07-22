import { AutumnContext, useAutumnContext } from "@/AutumnContext";
import { QueryParams } from "@/client/types/clientGenTypes";
import { AutumnError, QueryResult } from "@sdk";
import useSWR from "swr";

export const useAnalytics = (params: QueryParams) => {
  const context = useAutumnContext({
    AutumnContext,
    name: "useAnalytics",
  });

  const client = context.client;

  const fetcher = async () => {
    try {
      const { data, error } = await client.query(params);
      if (error) throw error;

      return data;
    } catch (error) {
      throw new AutumnError({
        message: "Failed to fetch analytics",
        code: "fetch_analytics_failed",
      });
    }
  };

  const { data, error, mutate } = useSWR<QueryResult, AutumnError>(
    "analytics",
    fetcher,
    { refreshInterval: 0 }
  );

  return {
    data: data?.list,
    isLoading: !error && !data,
    error,
    refetch: mutate,
  };
};
