import { setContext, getContext } from "svelte";
import { SvelteAutumnClient, type SvelteAutumnClientConfig } from "./SvelteAutumnClient.svelte";
import type { Customer, AutumnError } from "../../sdk";

const AUTUMN_CONTEXT_KEY = Symbol("autumn");

export interface AutumnContextValue {
  // Client instance
  readonly client: SvelteAutumnClient;

  // Customer state (reactive via getters/setters)
  readonly customer: Customer | null;
  readonly isLoading: boolean;
  readonly error: AutumnError | null;

  // Methods to update state
  setCustomer: (customer: Customer | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: AutumnError | null) => void;

  // Refetch customer data
  refetch: () => Promise<Customer | null>;
}

/**
 * Creates the Autumn context with reactive state using Svelte 5 runes.
 * Must be called in a component's script during initialization.
 * 
 * @example
 * ```svelte
 * <script>
 *   import { createAutumnContext } from 'autumn-js/svelte';
 *   
 *   createAutumnContext({
 *     backendUrl: 'https://api.example.com'
 *   });
 * </script>
 * ```
 */
export function createAutumnContext(
  config: SvelteAutumnClientConfig
): AutumnContextValue {
  const client = new SvelteAutumnClient(config);

  // Reactive state using $state rune
  let customer = $state<Customer | null>(null);
  let isLoading = $state(true);
  let error = $state<AutumnError | null>(null);

  const fetchCustomer = async (): Promise<Customer | null> => {
    isLoading = true;
    error = null;

    try {
      const { data, error: fetchError } = await client.createCustomer({
        errorOnNotFound: false,
      });

      if (fetchError) {
        error = fetchError;
        customer = null;
        return null;
      }

      customer = data;
      return data;
    } catch (e: any) {
      error = e;
      customer = null;
      return null;
    } finally {
      isLoading = false;
    }
  };

  // Initial fetch
  fetchCustomer();

  const context: AutumnContextValue = {
    get client() {
      return client;
    },
    get customer() {
      return customer;
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },
    setCustomer: (c: Customer | null) => {
      customer = c;
    },
    setIsLoading: (loading: boolean) => {
      isLoading = loading;
    },
    setError: (e: AutumnError | null) => {
      error = e;
    },
    refetch: fetchCustomer,
  };

  setContext(AUTUMN_CONTEXT_KEY, context);

  return context;
}

/**
 * Retrieves the Autumn context from a parent AutumnProvider.
 * Must be called in a component that is a descendant of AutumnProvider.
 * 
 * @example
 * ```svelte
 * <script>
 *   import { getAutumnContext } from 'autumn-js/svelte';
 *   
 *   const { customer, isLoading } = getAutumnContext();
 * </script>
 * 
 * {#if isLoading}
 *   <p>Loading...</p>
 * {:else if customer}
 *   <p>Welcome, {customer.name}!</p>
 * {/if}
 * ```
 */
export function getAutumnContext(): AutumnContextValue {
  const context = getContext<AutumnContextValue>(AUTUMN_CONTEXT_KEY);

  if (!context) {
    throw new Error(
      "getAutumnContext must be called within a component that is a descendant of AutumnProvider"
    );
  }

  return context;
}

/**
 * Attempts to get the Autumn context without throwing if not found.
 * Returns null if context is not available.
 */
export function tryGetAutumnContext(): AutumnContextValue | null {
  try {
    return getContext<AutumnContextValue>(AUTUMN_CONTEXT_KEY) || null;
  } catch {
    return null;
  }
}

