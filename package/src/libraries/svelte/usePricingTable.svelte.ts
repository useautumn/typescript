import { getAutumnContext } from "./context.svelte";
import type { Product } from "../../sdk";

export interface ProductDetails {
  id: string;
  name?: string;
  description?: string;
  cta?: string;
  features?: string[];
}

export interface PricingTableProduct extends Product {
  details?: ProductDetails;
}

export interface UsePricingTableReturn {
  /** List of products with pricing information */
  readonly products: PricingTableProduct[];
  /** Whether products are loading */
  readonly isLoading: boolean;
  /** Any error from fetching products */
  readonly error: Error | null;
  /** Refetch the pricing table */
  refetch: () => Promise<void>;
}

/**
 * Svelte 5 hook for fetching and managing pricing table data.
 * 
 * @example
 * ```svelte
 * <script>
 *   import { usePricingTable } from 'autumn-js/svelte';
 *   
 *   const pricing = usePricingTable();
 * </script>
 * 
 * {#if pricing.isLoading}
 *   <p>Loading pricing...</p>
 * {:else}
 *   {#each pricing.products as product}
 *     <div>
 *       <h3>{product.name}</h3>
 *       <p>{product.description}</p>
 *     </div>
 *   {/each}
 * {/if}
 * ```
 */
export function usePricingTable(params?: {
  productDetails?: ProductDetails[];
}): UsePricingTableReturn {
  const context = getAutumnContext();
  const { client } = context;

  let products = $state<PricingTableProduct[]>([]);
  let isLoading = $state(true);
  let error = $state<Error | null>(null);

  const fetchProducts = async () => {
    isLoading = true;
    error = null;

    try {
      const { data, error: fetchError } = await client.products.list();

      if (fetchError) {
        error = fetchError;
        products = [];
        return;
      }

      // Merge with product details if provided
      const productList = data?.list || [];
      
      if (params?.productDetails) {
        products = productList.map((product: Product) => {
          const details = params.productDetails?.find(
            (d) => d.id === product.id
          );
          return {
            ...product,
            details,
          };
        });
      } else {
        products = productList;
      }
    } catch (e: any) {
      error = e;
      products = [];
    } finally {
      isLoading = false;
    }
  };

  // Initial fetch
  fetchProducts();

  return {
    get products() {
      return products;
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },
    refetch: fetchProducts,
  };
}

