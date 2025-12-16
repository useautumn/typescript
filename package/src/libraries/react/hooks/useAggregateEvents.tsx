import { AutumnContext, useAutumnContext } from "@/AutumnContext";
import type {
  EventAggregationParams,
  EventAggregationResponse,
} from "@/client/types/clientAnalyticsTypes";
import { AutumnError } from "@sdk";
import useSWR from "swr";

export const useAggregateEvents = (params: EventAggregationParams) => {
  const context = useAutumnContext({
    AutumnContext,
    name: "useAggregateEvents",
  });

  const client = context.client;

  const fetcher = async () => {
    try {
      const { data, error } = await client.events.aggregate(params);
      if (error) throw error;

      return data;
    } catch (error) {
      throw new AutumnError({
        message: "Failed to fetch event aggregation",
        code: "fetch_event_aggregation_failed",
      });
    }
  };

  const { data, error, mutate } = useSWR<EventAggregationResponse, AutumnError>(
    ["eventAggregate", params.customer_id, params.feature_id, params.range, params.bin_size],
    fetcher,
    { refreshInterval: 0 }
  );

  return {
    list: data?.list,
    total: data?.total,
    isLoading: !error && !data,
    error,
    refetch: mutate,
  };
};