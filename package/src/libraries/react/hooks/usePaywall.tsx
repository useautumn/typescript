import { AutumnContext, useAutumnContext } from "@/AutumnContext";
import { AutumnClient } from "@/client/ReactAutumnClient";
import { CheckFeaturePreview } from "@sdk";
import useSWR from "swr";

export const usePaywall = ({
  featureId,
  entityId,
}: {
  featureId?: string;
  entityId?: string;
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

  const queryKey = [`check`, featureId, entityId];

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
