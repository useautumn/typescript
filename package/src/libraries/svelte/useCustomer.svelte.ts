import { getAutumnContext } from "./context.svelte";
import type { Customer, AutumnError } from "../../sdk";

export interface AttachParams {
  productId: string;
  successUrl?: string;
  cancelUrl?: string;
  options?: Record<string, unknown>;
}

export interface CheckoutParams {
  productId: string;
  successUrl?: string;
  cancelUrl?: string;
  options?: Record<string, unknown>;
}

export interface CancelParams {
  productId: string;
  cancelAtPeriodEnd?: boolean;
}

export interface CheckParams {
  featureId: string;
  delta?: number;
}

export interface TrackParams {
  featureId: string;
  delta?: number;
  entityId?: string;
  set?: number;
}

/**
 * Client-side check result for feature access.
 * Simplified from the full server-side CheckResult type.
 */
export interface ClientCheckResult {
  allowed: boolean;
  reason?: string;
  balance?: number;
  feature_id?: string;
  unlimited?: boolean;
}

export interface UseCustomerReturn {
  /** Current customer data */
  readonly customer: Customer | null;
  /** Whether customer data is loading */
  readonly isLoading: boolean;
  /** Any error from fetching customer data */
  readonly error: AutumnError | null;

  /** Attach a product to the customer */
  attach: (params: AttachParams) => Promise<any>;
  /** Initiate checkout for a product */
  checkout: (params: CheckoutParams) => Promise<any>;
  /** Cancel a subscription */
  cancel: (params: CancelParams) => Promise<any>;
  /** Check feature access (client-side) */
  check: (params: CheckParams) => ClientCheckResult;
  /** Track feature usage */
  track: (params: TrackParams) => Promise<any>;
  /** Open billing portal */
  openBillingPortal: (params?: { returnUrl?: string }) => Promise<any>;
  /** Setup payment method */
  setupPayment: (params?: { successUrl?: string }) => Promise<any>;
  /** Create an entity */
  createEntity: (
    params: { id: string; name?: string; featureId?: string } | { id: string; name?: string; featureId?: string }[]
  ) => Promise<any>;
  /** Create a referral code */
  createReferralCode: (params: { code?: string; programId?: string }) => Promise<any>;
  /** Redeem a referral code */
  redeemReferralCode: (params: { code: string }) => Promise<any>;
  /** Refetch customer data */
  refetch: () => Promise<Customer | null>;
}

/**
 * Svelte 5 hook for managing customer billing, subscriptions, and feature access.
 * 
 * @example
 * ```svelte
 * <script>
 *   import { useCustomer } from 'autumn-js/svelte';
 *   
 *   const customer = useCustomer();
 * </script>
 * 
 * {#if customer.isLoading}
 *   <p>Loading...</p>
 * {:else if customer.customer}
 *   <p>Welcome, {customer.customer.name}!</p>
 *   <button onclick={() => customer.attach({ productId: 'pro' })}>
 *     Upgrade to Pro
 *   </button>
 * {/if}
 * ```
 */
export function useCustomer(): UseCustomerReturn {
  const context = getAutumnContext();
  const { client } = context;

  const checkFeature = (params: CheckParams): ClientCheckResult => {
    const customer = context.customer;

    if (!customer) {
      return {
        allowed: false,
        reason: "no_customer",
      };
    }

    // Find the feature in customer's features object
    const features = customer.features || {};
    const feature = features[params.featureId];

    if (!feature) {
      return {
        allowed: false,
        reason: "feature_not_found",
        feature_id: params.featureId,
      };
    }

    // Static features are always allowed
    if (feature.type === "static") {
      return {
        allowed: true,
        feature_id: params.featureId,
      };
    }

    // Check if feature has unlimited access
    if (feature.unlimited || feature.overage_allowed) {
      return {
        allowed: true,
        feature_id: params.featureId,
        unlimited: true,
      };
    }

    // Check balance-based features
    const delta = params.delta ?? 1;
    const balance = feature.balance ?? 0;

    // Handle usage limits
    if (feature.usage_limit) {
      const extraUsage = (feature.usage_limit || 0) - (feature.included_usage || 0);
      const effectiveBalance = balance + extraUsage;
      
      if (effectiveBalance >= delta) {
        return {
          allowed: true,
          balance: effectiveBalance,
          feature_id: params.featureId,
        };
      }
    } else if (balance >= delta) {
      return {
        allowed: true,
        balance,
        feature_id: params.featureId,
      };
    }

    return {
      allowed: false,
      reason: "insufficient_balance",
      balance,
      feature_id: params.featureId,
    };
  };

  return {
    get customer() {
      return context.customer;
    },
    get isLoading() {
      return context.isLoading;
    },
    get error() {
      return context.error;
    },

    attach: async (params: AttachParams) => {
      const result = await client.attach(params);
      // Refetch customer after attach
      if (!result.error) {
        await context.refetch();
      }
      return result;
    },

    checkout: async (params: CheckoutParams) => {
      const result = await client.checkout(params);
      if (result.data?.checkout_url) {
        window.location.href = result.data.checkout_url;
      }
      return result;
    },

    cancel: async (params: CancelParams) => {
      const result = await client.cancel(params);
      if (!result.error) {
        await context.refetch();
      }
      return result;
    },

    check: checkFeature,

    track: async (params: TrackParams) => {
      const result = await client.track(params);
      if (!result.error) {
        await context.refetch();
      }
      return result;
    },

    openBillingPortal: async (params) => {
      const result = await client.openBillingPortal(params);
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
      return result;
    },

    setupPayment: async (params) => {
      const result = await client.setupPayment(params);
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
      return result;
    },

    createEntity: async (params) => {
      return await client.entities.create(params);
    },

    createReferralCode: async (params) => {
      return await client.referrals.createCode(params);
    },

    redeemReferralCode: async (params) => {
      return await client.referrals.redeemCode(params);
    },

    refetch: context.refetch,
  };
}

