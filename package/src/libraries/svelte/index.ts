// Autumn Svelte 5 Library
// Provides reactive billing, subscriptions, and feature access for Svelte applications

// Note: The AutumnProvider.svelte component should be imported directly:
// import AutumnProvider from 'autumn-js/svelte/AutumnProvider.svelte';

// Context utilities
export {
  createAutumnContext,
  getAutumnContext,
  tryGetAutumnContext,
  type AutumnContextValue,
} from "./context.svelte";

// Hook-like functions (Svelte 5 runes-based)
export {
  useCustomer,
  type UseCustomerReturn,
  type ClientCheckResult,
  type AttachParams,
  type CheckoutParams,
  type CancelParams,
  type CheckParams,
  type TrackParams,
} from "./useCustomer.svelte";
export {
  usePricingTable,
  type UsePricingTableReturn,
  type PricingTableProduct,
  type ProductDetails,
} from "./usePricingTable.svelte";
export { useEntity, type UseEntityReturn, type UseEntityParams } from "./useEntity.svelte";
export { usePaywall, type UsePaywallReturn, type UsePaywallParams } from "./usePaywall.svelte";

// Client (for advanced usage)
export {
  SvelteAutumnClient,
  type SvelteAutumnClientConfig,
} from "./SvelteAutumnClient.svelte";

// Re-export common types from SDK
export type {
  Customer,
  Entity,
  Product,
  CheckResult,
  AutumnError,
  CustomerData,
} from "../../sdk";

