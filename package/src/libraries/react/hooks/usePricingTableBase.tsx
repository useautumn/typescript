import useSWR from "swr";
import { AutumnError, PricingTableProduct } from "../../../sdk";
import { ProductDetails } from "../client/types/clientPricingTableTypes";
import { useContext } from "react";
import { toSnakeCase } from "../utils/toSnakeCase";

const mergeProductDetails = (
  products: PricingTableProduct[] | undefined,
  productDetails?: ProductDetails[]
): PricingTableProduct[] | null => {
  // console.log("products", products);

  if (!products) {
    return null;
  }

  if (!productDetails) {
    return products;
  }

  let fetchedProducts = structuredClone(products);

  let mergedProducts: PricingTableProduct[] = [];
  for (const overrideDetails of productDetails) {
    if (!overrideDetails.id) {
      mergedProducts.push(toSnakeCase(overrideDetails));
      continue;
    }

    let fetchedProduct = fetchedProducts.find(
      (p) => p.id === overrideDetails.id
    );

    if (!fetchedProduct) {
      continue;
    }

    // 1. Merge price
    let mergedPrice;
    let overridePrice = overrideDetails.price;
    if (overridePrice) {
      mergedPrice = {
        ...fetchedProduct.price,
        primary_text: overridePrice.primaryText,
        secondary_text: overridePrice.secondaryText,
      };
    } else {
      mergedPrice = fetchedProduct.price;
    }

    let overrideItems = overrideDetails.items;
    let mergedItems = [];
    if (overrideItems) {
      for (const overrideItem of overrideItems) {
        if (!overrideItem.featureId) {
          mergedItems.push({
            primary_text: overrideItem.primaryText,
            secondary_text: overrideItem.secondaryText,
          });
        } else {
          let fetchedItem = fetchedProduct.items.find(
            (i) => i.feature_id === overrideItem.featureId
          );
          if (!fetchedItem) {
            console.error(
              `Feature with id ${overrideItem.featureId} not found for product ${fetchedProduct.id}`
            );
            continue;
          }
          mergedItems.push({
            ...fetchedItem,
            primary_text: overrideItem.primaryText || fetchedItem.primary_text,
            secondary_text:
              overrideItem.secondaryText || fetchedItem.secondary_text,
          });
        }
      }
    }

    const mergedProduct: PricingTableProduct = {
      ...fetchedProduct,
      description: overrideDetails.description,
      button_text: overrideDetails.buttonText,
      recommend_text: overrideDetails.recommendText,
      everything_from: overrideDetails.everythingFrom,
      price: mergedPrice,
      items: mergedItems,
    };

    console.log("Override Details", overrideDetails);
    console.log("Merged Product", mergedProduct);
    mergedProducts.push(mergedProduct);
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
