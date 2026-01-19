import type { CustomerExpandOption } from "@sdk";
import { AutumnContext } from "../AutumnContext";
import {
  useCustomerBase,
  type UseCustomerParams,
  type UseCustomerResult,
} from "./useCustomerBase";

/**
 * React hook for managing customer billing, subscriptions, and feature access.
 *
 * Provides access to all Autumn billing functions including product attachment,
 * subscription management, usage tracking, and feature gating. Automatically
 * handles customer data fetching and caching.
 *
 * @param params - Optional configuration for the hook
 * @returns Object containing customer data and billing functions
 *
 * @example
 * ```tsx
 * import { useCustomer } from "autumn-js/react";
 *
 * function MyComponent() {
 *   const {
 *     customer,
 *     isLoading,
 *     attach,
 *     cancel,
 *     check,
 *     track,
 *     checkout,
 *     openBillingPortal,
 *     setupPayment,
 *     createReferralCode,
 *     redeemReferralCode,
 *     createEntity,
 *     refetch
 *   } = useCustomer();
 *
 *   return (
 *     <div>
 *       <button onClick={() => attach({ productId: "pro" })}>
 *         Upgrade to Pro
 *       </button>
 *       <button onClick={() => cancel({ productId: "pro" })}>
 *         Cancel Subscription
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With expanded fields - customer.entities will be typed
 * const { customer } = useCustomer({ expand: ['entities', 'invoices'] });
 * customer?.entities; // Entity[] - fully typed!
 * customer?.invoices; // CustomerInvoice[] - fully typed!
 * ```
 *
 * @returns {Object} Hook result object
 * @returns {Customer | null} returns.customer - Current customer data with subscription info
 * @returns {boolean} returns.isLoading - Whether customer data is loading
 * @returns {AutumnError | null} returns.error - Any error from customer data fetching
 * @returns {Function} returns.attach - Attach product to customer with billing
 * @returns {Function} returns.cancel - Cancel customer subscription/product
 * @returns {Function} returns.check - Check feature access and show paywalls
 * @returns {Function} returns.track - Track feature usage events
 * @returns {Function} returns.checkout - Initiate product checkout flow
 * @returns {Function} returns.openBillingPortal - Open Stripe billing portal
 * @returns {Function} returns.setupPayment - Setup payment method
 * @returns {Function} returns.createReferralCode - Create referral codes
 * @returns {Function} returns.redeemReferralCode - Redeem referral codes
 * @returns {Function} returns.createEntity - Create entities for granular tracking
 * @returns {Function} returns.refetch - Manually refetch customer data
 */
export const useCustomer = <
  const T extends readonly CustomerExpandOption[] = readonly [],
>(
  params?: UseCustomerParams<T>,
): UseCustomerResult<T> => {
  return useCustomerBase({
    params,
    AutumnContext: AutumnContext,
  });
};
