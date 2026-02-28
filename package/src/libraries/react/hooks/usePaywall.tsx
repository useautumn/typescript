import { AutumnContext, useAutumnContext } from "@/AutumnContext";
import { CheckFeaturePreview } from "@sdk";
import useSWR from "swr";

export const usePaywall = ({
  featureId,
  entityId,
  extraQueryKeys,
}: {
  featureId?: string;
  entityId?: string;
  /** Extra key(s) appended to the SWR query key that trigger a refetch when any value changes. */
  extraQueryKeys?: (string | null | undefined)[];
}) => {
  const context = useAutumnContext({
    AutumnContext,
    name: "usePaywall",
  });

  const enabled = !!featureId && !!context;

  const fetcher = async () => {
    if (!featureId) {
      return { preview: undefined };
    }

    const { data, error } = await context.client.check({
      featureId,
      withPreview: true,
    });
    if (error) throw error;
    return data;
  };

  const queryKey = [`check`, featureId, entityId, ...(extraQueryKeys ?? [])];

  const { data, error, isLoading } = useSWR(queryKey, fetcher, {
    refreshInterval: 0,
    enabled,
  });

  return {
    data: data?.preview as CheckFeaturePreview | undefined,
    error,
    isLoading,
  };
};
