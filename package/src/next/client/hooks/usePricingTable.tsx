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
const mergeProductDetails = (
  products: any[],
  productDetails?: ProductDetails[]
) => {
  if (!products) {
    return [];
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
  const [products, setProducts] = useState<any[]>([]);

  const fetchProducts = async () => {
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
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
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
