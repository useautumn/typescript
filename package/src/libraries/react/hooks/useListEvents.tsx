import { AutumnContext, useAutumnContext } from "@/AutumnContext";
import type {
  EventListParams,
  EventListResponse,
} from "@/client/types/clientAnalyticsTypes";
import { AutumnError } from "@sdk";
import useSWR from "swr";

export const useListEvents = (params: EventListParams) => {
  const context = useAutumnContext({
    AutumnContext,
    name: "useListEvents",
  });

  const client = context.client;

  const fetcher = async () => {
    try {
      const { data, error } = await client.events.list(params);
      if (error) throw error;

      return data;
    } catch (error) {
      throw new AutumnError({
        message: "Failed to fetch event list",
        code: "fetch_event_list_failed",
      });
    }
  };

  const { data, error, mutate } = useSWR<EventListResponse, AutumnError>(
    ["eventList", params.customer_id, params.feature_id, params.time_range],
    fetcher,
    { refreshInterval: 0 }
  );

  return {
    list: data?.list,
    hasMore: data?.has_more,
    nextCursor: data?.next_cursor,
    isLoading: !error && !data,
    error,
    refetch: mutate,
  };
};