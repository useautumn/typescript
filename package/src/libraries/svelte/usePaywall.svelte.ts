import { getAutumnContext } from "./context.svelte";

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

export interface UsePaywallParams {
  featureId: string;
  delta?: number;
}

export interface UsePaywallReturn {
  /** Whether the feature is allowed */
  readonly allowed: boolean;
  /** Whether the check is loading */
  readonly isLoading: boolean;
  /** The balance remaining (if applicable) */
  readonly balance: number | undefined;
  /** The reason access was denied */
  readonly reason: string | undefined;
  /** The full check result */
  readonly checkResult: ClientCheckResult;
  /** Recheck the feature access */
  recheck: () => void;
}

/**
 * Svelte 5 hook for implementing feature paywalls.
 * Provides reactive feature gating based on customer entitlements.
 * 
 * @example
 * ```svelte
 * <script>
 *   import { usePaywall } from 'autumn-js/svelte';
 *   
 *   const paywall = usePaywall({ featureId: 'advanced_analytics' });
 * </script>
 * 
 * {#if paywall.isLoading}
 *   <p>Checking access...</p>
 * {:else if paywall.allowed}
 *   <AdvancedAnalytics />
 * {:else}
 *   <UpgradePrompt reason={paywall.reason} />
 * {/if}
 * ```
 */
export function usePaywall(params: UsePaywallParams): UsePaywallReturn {
  const context = getAutumnContext();

  // Derived state that recomputes when customer changes
  let checkResult = $derived.by((): ClientCheckResult => {
    const customer = context.customer;

    if (context.isLoading) {
      return {
        allowed: false,
        reason: "loading",
      };
    }

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

    if (feature.unlimited || feature.overage_allowed) {
      return {
        allowed: true,
        feature_id: params.featureId,
        unlimited: true,
      };
    }

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
  });

  return {
    get allowed() {
      return checkResult.allowed;
    },
    get isLoading() {
      return context.isLoading;
    },
    get balance() {
      return checkResult.balance;
    },
    get reason() {
      return checkResult.reason;
    },
    get checkResult() {
      return checkResult;
    },
    recheck: () => {
      context.refetch();
    },
  };
}
