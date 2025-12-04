import { getAutumnContext } from "./context.svelte";
import type { Entity, AutumnError } from "../../sdk";

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

export interface UseEntityParams {
  entityId: string;
  expand?: string[];
}

export interface UseEntityReturn {
  /** Current entity data */
  readonly entity: Entity | null;
  /** Whether entity data is loading */
  readonly isLoading: boolean;
  /** Any error from fetching entity data */
  readonly error: AutumnError | null;

  /** Check feature access for this entity (client-side) */
  check: (params: { featureId: string; delta?: number }) => ClientCheckResult;
  /** Track feature usage for this entity */
  track: (params: { featureId: string; delta?: number; set?: number }) => Promise<any>;
  /** Refetch entity data */
  refetch: () => Promise<Entity | null>;
}

/**
 * Svelte 5 hook for managing entity-level billing and feature access.
 * Entities allow per-user or per-workspace feature limits.
 * 
 * @example
 * ```svelte
 * <script>
 *   import { useEntity } from 'autumn-js/svelte';
 *   
 *   const entity = useEntity({ entityId: 'workspace_123' });
 * </script>
 * 
 * {#if entity.isLoading}
 *   <p>Loading...</p>
 * {:else if entity.entity}
 *   <p>Workspace: {entity.entity.name}</p>
 *   
 *   {#if entity.check({ featureId: 'api_calls' }).allowed}
 *     <button onclick={() => entity.track({ featureId: 'api_calls' })}>
 *       Make API Call
 *     </button>
 *   {:else}
 *     <p>API call limit reached</p>
 *   {/if}
 * {/if}
 * ```
 */
export function useEntity(params: UseEntityParams): UseEntityReturn {
  const context = getAutumnContext();
  const { client } = context;

  let entity = $state<Entity | null>(null);
  let isLoading = $state(true);
  let error = $state<AutumnError | null>(null);

  const fetchEntity = async (): Promise<Entity | null> => {
    isLoading = true;
    error = null;

    try {
      const { data, error: fetchError } = await client.entities.get(
        params.entityId,
        { expand: params.expand }
      );

      if (fetchError) {
        error = fetchError;
        entity = null;
        return null;
      }

      entity = data;
      return data;
    } catch (e: any) {
      error = e;
      entity = null;
      return null;
    } finally {
      isLoading = false;
    }
  };

  // Initial fetch
  fetchEntity();

  const checkFeature = (checkParams: {
    featureId: string;
    delta?: number;
  }): ClientCheckResult => {
    if (!entity) {
      return {
        allowed: false,
        reason: "no_entity",
      };
    }

    // Find the feature in entity's features object
    const features = (entity as any).features || {};
    const feature = features[checkParams.featureId];

    if (!feature) {
      return {
        allowed: false,
        reason: "feature_not_found",
        feature_id: checkParams.featureId,
      };
    }

    // Static features are always allowed
    if (feature.type === "static") {
      return {
        allowed: true,
        feature_id: checkParams.featureId,
      };
    }

    if (feature.unlimited || feature.overage_allowed) {
      return {
        allowed: true,
        feature_id: checkParams.featureId,
        unlimited: true,
      };
    }

    const delta = checkParams.delta ?? 1;
    const balance = feature.balance ?? 0;

    // Handle usage limits
    if (feature.usage_limit) {
      const extraUsage = (feature.usage_limit || 0) - (feature.included_usage || 0);
      const effectiveBalance = balance + extraUsage;
      
      if (effectiveBalance >= delta) {
        return {
          allowed: true,
          balance: effectiveBalance,
          feature_id: checkParams.featureId,
        };
      }
    } else if (balance >= delta) {
      return {
        allowed: true,
        balance,
        feature_id: checkParams.featureId,
      };
    }

    return {
      allowed: false,
      reason: "insufficient_balance",
      balance,
      feature_id: checkParams.featureId,
    };
  };

  return {
    get entity() {
      return entity;
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },

    check: checkFeature,

    track: async (trackParams) => {
      const result = await client.track({
        ...trackParams,
        entityId: params.entityId,
      });
      if (!result.error) {
        await fetchEntity();
      }
      return result;
    },

    refetch: fetchEntity,
  };
}

