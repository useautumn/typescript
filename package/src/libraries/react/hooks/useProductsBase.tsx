import { AutumnClient } from "@/client/ReactAutumnClient";
import useSWR from "swr";

export const useProductsBase = ({
  client,
  extraQueryKeys,
}: {
  client: AutumnClient;
  /** Extra key(s) appended to the SWR query key that trigger a refetch when any value changes. */
  extraQueryKeys?: (string | null | undefined)[];
}) => {
  const fetcher = async () => {
    const { data, error } = await client.products.list();
    if (error) throw error;
    return data?.list || [];
  };

  const queryKey = [`products`, ...(extraQueryKeys ?? [])];

  const { data, error, isLoading } = useSWR(queryKey, fetcher, {
    refreshInterval: 0,
    shouldRetryOnError: false,
  });

  return { products: data, error, isLoading };
};
