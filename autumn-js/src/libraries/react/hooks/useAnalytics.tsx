import { AutumnContext, useAutumnContext } from "@/AutumnContext";
import { QueryParams } from "@/clientTypes";
import Autumn from "@sdk";
import useSWR from "swr";

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
