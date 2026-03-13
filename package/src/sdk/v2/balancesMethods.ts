import { Autumn } from "../client";
import type { AutumnPromise } from "../response";
import type {
  V2UpdateBalanceParams,
  V2UpdateBalanceResponse,
  V2FinalizeLockParams,
  V2FinalizeLockResponse,
} from "./balancesTypes";

const V2_API_VERSION = "2.1.0";

/**
 * Updates a customer's balance using the v2.1 API
 */
export const handleBalancesUpdate = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: V2UpdateBalanceParams;
}): AutumnPromise<V2UpdateBalanceResponse> => {
  return instance.postWithVersion("/balances.update", params, V2_API_VERSION);
};

/**
 * Finalizes a balance lock (confirm or release) using the v2.1 API
 */
export const handleBalancesFinalize = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params: V2FinalizeLockParams;
}): AutumnPromise<V2FinalizeLockResponse> => {
  return instance.postWithVersion("/balances.finalize", params, V2_API_VERSION);
};

/**
 * Creates the v2 balances methods object
 */
export const v2BalancesMethods = (instance?: Autumn) => {
  const wrapper = <TParams, TReturn>(
    handler: (args: { instance: Autumn; params: TParams }) => Promise<TReturn>,
    params: TParams,
  ): Promise<TReturn> => {
    const inst = instance || new Autumn();
    return handler({ instance: inst, params });
  };

  return {
    /**
     * Updates a customer's balance for a specific feature.
     *
     * @param params - Update balance parameters
     * @returns Promise resolving to update balance response
     *
     * @example
     * ```typescript
     * // Set remaining balance to exact value
     * await autumn.v2.balances.update({
     *   customer_id: "cus_123",
     *   feature_id: "api_calls",
     *   remaining: 1000,
     * });
     *
     * // Add to existing balance
     * await autumn.v2.balances.update({
     *   customer_id: "cus_123",
     *   feature_id: "credits",
     *   add_to_balance: 500,
     * });
     *
     * // Update usage
     * await autumn.v2.balances.update({
     *   customer_id: "cus_123",
     *   feature_id: "api_calls",
     *   usage: 100,
     * });
     *
     * // Target specific balance by interval or balance_id
     * await autumn.v2.balances.update({
     *   customer_id: "cus_123",
     *   feature_id: "api_calls",
     *   balance_id: "bal_xyz",
     *   remaining: 500,
     * });
     * ```
     */
    update: (params: V2UpdateBalanceParams) =>
      wrapper(handleBalancesUpdate, params),

    /**
     * Finalizes a balance lock by confirming or releasing it.
     *
     * @param params - Finalize lock parameters
     * @returns Promise resolving to finalize lock response
     *
     * @example
     * ```typescript
     * // Confirm a lock (deduct the reserved balance)
     * await autumn.v2.balances.finalize({
     *   lock_id: "lock_abc123",
     *   action: "confirm",
     * });
     *
     * // Release a lock (return the reserved balance)
     * await autumn.v2.balances.finalize({
     *   lock_id: "lock_abc123",
     *   action: "release",
     * });
     *
     * // Confirm with a different value than originally reserved
     * await autumn.v2.balances.finalize({
     *   lock_id: "lock_abc123",
     *   action: "confirm",
     *   override_value: 5,
     * });
     * ```
     */
    finalize: (params: V2FinalizeLockParams) =>
      wrapper(handleBalancesFinalize, params),
  };
};
