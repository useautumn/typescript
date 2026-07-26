import { AutumnClient } from "@/client/ReactAutumnClient";
import { AutumnContext, useAutumnContext } from "../AutumnContext";
import useSWR from "swr";

export const useProductsBase = ({ client, group }: { client: AutumnClient, group?: string }) => {
  const fetcher = async () => {
    const { data, error } = await client.products.list({ group });
    if (error) throw error;
    return data?.list || [];
  };

  const queryKey = [`products`, group];

  const { data, error, isLoading } = useSWR(queryKey, fetcher, {
    refreshInterval: 0,
    shouldRetryOnError: false,
  });

  return { products: data, error, isLoading };
};
