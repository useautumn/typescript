// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Generated from @autumn/shared schemas
// Run `pnpm gen:atmn` to regenerate

import type { Plan, PlanFeature, FreeTrial } from "../models/planModels.js";
import type { Feature } from "../models/featureModels.js";

type PlanInput = Omit<Plan, 'description' | 'add_on' | 'default' | 'group'> & Partial<Pick<Plan, 'description' | 'add_on' | 'default' | 'group'>>;

/**
 * Define a pricing plan in your Autumn configuration
 *
 * @param p - Plan configuration
 * @returns Plan object for use in autumn.config.ts
 *
 * @example
 * export const pro = plan({
 *   id: 'pro',
 *   name: 'Pro Plan',
 *   description: 'For growing teams',
 *   features: [
 *     planFeature({ feature_id: seats.id, granted: 10 }),
 *     planFeature({
 *       feature_id: messages.id,
 *       granted: 1000,
 *       reset: { interval: 'month' }
 *     })
 *   ],
 *   price: { amount: 50, interval: 'month' }
 * });
 */
export const plan = (params: PlanInput): Plan => {
  return {
    ...params,
    description: params.description ?? null,
    add_on: params.add_on ?? false,
    default: params.default ?? false,
    group: params.group ?? ""
  };
};

/**
 * Define a feature that can be included in plans
 *
 * @param f - Feature configuration
 * @returns Feature object for use in autumn.config.ts
 *
 * @example
 * export const seats = feature({
 *   id: 'seats',
 *   name: 'Team Seats',
 *   type: 'continuous_use'
 * });
 */
export const feature = (params: Feature): Feature => {
  return params;
};

/**
 * Include a feature in a plan with specific configuration
 *
 * @param config - Feature configuration for this plan
 * @returns PlanFeature for use in plan's features array
 *
 * @example
 * // Simple included usage
 * planFeature({
 *   feature_id: messages.id,
 *   granted: 1000,
 *   reset: { interval: 'month' }
 * })
 *
 * @example
 * // Priced feature with tiers
 * planFeature({
 *   feature_id: seats.id,
 *   granted: 5,
 *   price: {
 *     tiers: [
 *       { to: 10, amount: 10 },
 *       { to: 'inf', amount: 8 }
 *     ],
 *     interval: 'month',
 *     usage_model: 'pay_per_use'
 *   }
 * })
 */
export const planFeature = (params: PlanFeature): PlanFeature => {
  return params;
};
