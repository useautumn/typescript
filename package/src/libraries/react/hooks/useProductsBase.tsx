import { AutumnClient } from "@/client/ReactAutumnClient";
import { AutumnContext, useAutumnContext } from "../AutumnContext";
import useSWR from "swr";

export const useProductsBase = ({ client }: { client: AutumnClient }) => {
  const fetcher = async () => {
    const { data, error } = await client.products.list();
    if (error) throw error;
    return data?.list || [];
  };

  const queryKey = [`products`];

  const { data, error, isLoading } = useSWR(queryKey, fetcher, {
    refreshInterval: 0,
  });

  return { products: data, error, isLoading };
};
