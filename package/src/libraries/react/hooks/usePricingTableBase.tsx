import useSWR from "swr";
import { AutumnClient } from "../client/ReactAutumnClient";
import { AutumnError, PricingTableProduct } from "../../../sdk";
import { ProductDetails } from "../client/types/clientPricingTableTypes";
import { useContext } from "react";

const mergeProductDetails = (
  products: PricingTableProduct[] | undefined,
  productDetails?: ProductDetails[]
) => {
  if (!products) {
    return null;
  }

  if (!productDetails) {
    return products;
  }

  let mergedProducts = structuredClone(products);

  for (const product of productDetails) {
    let index = mergedProducts.findIndex((p) => p.id === product.id);
    if (index == -1) {
      console.warn(`Product with id ${product.id} not found`);
      continue;
    }

    mergedProducts[index] = {
      ...mergedProducts[index],
      ...product,
    };
  }

  return mergedProducts;
};

export const usePricingTableBase = ({
  AutumnContext,
  params,
}: {
  AutumnContext: React.Context<any>;
  params?: {
    productDetails?: ProductDetails[];
  };
}) => {
  const context = useContext(AutumnContext);
  const fetcher = async () => {
    try {
      const { data, error } = await context.client.getPricingTable();
      if (error) throw error;
      return data?.list || [];
    } catch (error) {
      throw new AutumnError({
        message: "Failed to fetch pricing table products",
        code: "failed_to_fetch_pricing_table_products",
      });
    }
  };

  const { data, error, mutate } = useSWR<PricingTableProduct[], AutumnError>(
    "pricing-table",
    fetcher
  );

  return {
    products: mergeProductDetails(data || undefined, params?.productDetails),
    isLoading: !error && !data,
    error,
    refetch: mutate,
  };
};
