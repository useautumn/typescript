import { useEffect, useState } from "react";
import { useAutumnContext } from "../AutumnContext";
import { getPricingTableAction } from "../../server/componentActions";

export interface ProductDetails {
  id: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  recommendText?: string;
}

export interface PricingTableProduct {
  id: string;
  name: string;
  buttonText: string;

  price: {
    primaryText: string;
    secondaryText?: string;
  };

  items: {
    primaryText: string;
    secondaryText?: string;
  }[];
}

const mergeProductDetails = (
  products: any[] | null,
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

export const usePricingTable = (options?: {
  productDetails: {
    id: string;
    description?: string;
    buttonText?: string;
    buttonUrl?: string;
    recommendText?: string;
  }[];
}) => {
  const { encryptedCustomerId } = useAutumnContext();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [products, setProducts] = useState<
    (PricingTableProduct & ProductDetails)[] | null
  >(null);

  const fetchProducts = async () => {
    let returnData: PricingTableProduct[] | null = null;
    try {
      setIsLoading(true);
      const res = await getPricingTableAction({
        encryptedCustomerId,
      });

      if (res.error) {
        setError(res.error);
        return res;
      }

      let products = res.data.list;
      setProducts(products);
      returnData = products;
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
    return returnData;
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products: mergeProductDetails(products, options?.productDetails),
    isLoading,
    error,
    refetch: fetchProducts,
  };
};
