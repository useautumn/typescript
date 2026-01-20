// Auto-generated Zod schema
import { z } from "zod";
import { CustomerDataSchema } from "./customerDataTypes";
import { EntityDataSchema } from "./entityDataTypes";
import type { CustomerData } from "./customerDataTypes";
import type { EntityData } from "./entityDataTypes";

export const AttachParamsUnionMember0Schema = z.object({
  length: z.union([z.string(), z.number()]),
  cardRequired: z.boolean().optional(),
  duration: z.union([z.literal('day'), z.literal('month'), z.literal('year')]).optional(),
  uniqueFingerprint: z.boolean().optional()
});

export const AttachParamsItemSchema = z.object({
  interval: z.union([z.literal('minute'), z.literal('hour'), z.literal('day'), z.literal('week'), z.literal('month'), z.literal('quarter'), z.literal('semi_annual'), z.literal('year')]).nullable().describe("The reset or billing interval of the product item. If null, feature will have no\nreset date, and if there's a price, it will be billed one-off."),
  billingUnits: z.number().nullable().describe("The billing units of the product item (eg $1 for 30 credits).").optional(),
  config: z.unknown().nullable().optional(),
  createdAt: z.number().nullable().optional(),
  display: z.unknown().nullable().optional(),
  entitlementId: z.string().nullable().optional(),
  entityFeatureId: z.string().nullable().describe("The feature ID of the entity (like seats) to track sub-balances for.").optional(),
  feature: z.unknown().nullable().optional(),
  featureId: z.string().nullable().describe("The feature ID of the product item. Should be null for fixed price items.").optional(),
  featureType: z.union([z.literal('single_use'), z.literal('continuous_use'), z.literal('boolean'), z.literal('static')]).nullable().optional(),
  includedUsage: z.union([z.number(), z.literal('inf')]).nullable().describe("The amount of usage included for this feature (per interval).").optional(),
  intervalCount: z.number().nullable().describe("Interval count of the feature.").optional(),
  price: z.number().nullable().describe("The price of the product item. Should be null if tiered pricing is set.").optional(),
  priceConfig: z.unknown().optional(),
  priceId: z.string().nullable().optional(),
  resetUsageWhenEnabled: z.boolean().nullable().describe("Whether the usage should be reset when the product is enabled.").optional(),
  tiers: z.array(z.unknown()).nullable().describe("Tiered pricing for the product item. Not applicable for fixed price items.").optional(),
  type: z.union([z.literal('feature'), z.literal('priced_feature'), z.literal('price')]).nullable().describe("The type of the product item.").optional(),
  usageLimit: z.number().nullable().optional(),
  usageModel: z.union([z.literal('prepaid'), z.literal('pay_per_use')]).nullable().describe("Whether the feature should be prepaid upfront or billed for how much they use\nend of billing period.").optional()
});

export const AttachParamsItemConfigSchema = z.object({
  onDecrease: z.union([z.unknown(), z.literal('prorate_immediately'), z.literal('prorate_next_cycle'), z.literal('none'), z.literal('no_prorations')]).nullable().optional(),
  onIncrease: z.union([z.unknown(), z.literal('prorate_immediately'), z.literal('prorate_next_cycle'), z.literal('bill_next_cycle')]).nullable().optional(),
  rollover: z.unknown().nullable().optional()
});

export const AttachParamsItemConfigRolloverSchema = z.object({
  length: z.number(),
  max: z.number().nullable(),
  duration: z.union([z.literal('month'), z.literal('forever')]).optional()
});

export const AttachParamsItemDisplaySchema = z.object({
  primaryText: z.string(),
  secondaryText: z.string().nullable().optional()
});

export const AttachParamsItemFeatureSchema = z.object({
  id: z.string().describe("The ID of the feature, used to refer to it in other API calls like /track or\n/check."),
  type: z.union([z.literal('static'), z.literal('boolean'), z.literal('single_use'), z.literal('continuous_use'), z.literal('credit_system')]).describe("The type of the feature"),
  archived: z.boolean().nullable().describe("Whether or not the feature is archived.").optional(),
  creditSchema: z.array(z.unknown()).nullable().describe("Credit cost schema for credit system features.").optional(),
  display: z.unknown().nullable().describe("Singular and plural display names for the feature.").optional(),
  name: z.string().nullable().describe("The name of the feature.").optional()
});

export const AttachParamsItemFeatureCreditSchemaSchema = z.object({
  creditCost: z.number().describe("The credit cost of the metered feature."),
  meteredFeatureId: z.string().describe("The ID of the metered feature (should be a single_use feature).")
});

export const AttachParamsItemFeatureDisplaySchema = z.object({
  plural: z.string().describe("The plural display name for the feature."),
  singular: z.string().describe("The singular display name for the feature.")
});

export const AttachParamsItemTierSchema = z.object({
  amount: z.number().describe("The price of the product item for this tier."),
  to: z.union([z.number(), z.literal('inf')]).describe("The maximum amount of usage for this tier.")
});

export const AttachParamsOptionSchema = z.object({
  featureId: z.string(),
  quantity: z.number(),
  adjustableQuantity: z.boolean().nullable().optional(),
  internalFeatureId: z.string().nullable().optional(),
  upcomingQuantity: z.number().nullable().optional()
});

export const AttachParamsSchema = z.object({
  billingCycleAnchor: z.number().optional(),
  checkoutSessionParams: z.unknown().optional(),
  customerData: CustomerDataSchema.nullable().describe("Customer details to set when creating a customer").optional(),
  enableProductImmediately: z.boolean().optional(),
  entityData: EntityDataSchema.optional(),
  entityId: z.string().nullable().optional(),
  finalizeInvoice: z.boolean().optional(),
  forceCheckout: z.boolean().optional(),
  freeTrial: z.union([z.unknown(), z.boolean()]).optional(),
  invoice: z.boolean().optional(),
  invoiceOnly: z.boolean().optional(),
  isCustom: z.boolean().optional(),
  items: z.array(AttachParamsItemSchema).optional(),
  metadata: z.unknown().optional(),
  newBillingSubscription: z.boolean().optional(),
  options: z.array(AttachParamsOptionSchema).nullable().optional(),
  productId: z.string().nullable().optional(),
  productIds: z.array(z.string()).nullable().optional(),
  reward: z.union([z.string(), z.array(z.string())]).optional(),
  setupPayment: z.boolean().optional(),
  successUrl: z.string().optional(),
  version: z.number().optional(),
  dialog: z.any().optional().describe("DEPRECATED: This field is deprecated and will be removed in a future version. Please use the checkout() method instead."),
  openInNewTab: z.boolean().optional().describe("Whether to open checkout in a new tab")
});

export interface AttachParamsUnionMember0 {
  length: string | number;

  cardRequired?: boolean;

  duration?: 'day' | 'month' | 'year';

  uniqueFingerprint?: boolean;
}

export interface AttachParamsItem {
  /**
   * The reset or billing interval of the product item. If null, feature will have no
reset date, and if there's a price, it will be billed one-off.
   */
  interval: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'semi_annual' | 'year' | null;

  /**
   * The billing units of the product item (eg $1 for 30 credits).
   */
  billingUnits?: number | null;

  config?: AttachParamsItemConfig | null;

  createdAt?: number | null;

  display?: AttachParamsItemDisplay | null;

  entitlementId?: string | null;

  /**
   * The feature ID of the entity (like seats) to track sub-balances for.
   */
  entityFeatureId?: string | null;

  feature?: AttachParamsItemFeature | null;

  /**
   * The feature ID of the product item. Should be null for fixed price items.
   */
  featureId?: string | null;

  featureType?: 'single_use' | 'continuous_use' | 'boolean' | 'static' | null;

  /**
   * The amount of usage included for this feature (per interval).
   */
  includedUsage?: number | 'inf' | null;

  /**
   * Interval count of the feature.
   */
  intervalCount?: number | null;

  /**
   * The price of the product item. Should be null if tiered pricing is set.
   */
  price?: number | null;

  priceConfig?: unknown;

  priceId?: string | null;

  /**
   * Whether the usage should be reset when the product is enabled.
   */
  resetUsageWhenEnabled?: boolean | null;

  /**
   * Tiered pricing for the product item. Not applicable for fixed price items.
   */
  tiers?: AttachParamsItemTier[] | null;

  /**
   * The type of the product item.
   */
  type?: 'feature' | 'priced_feature' | 'price' | null;

  usageLimit?: number | null;

  /**
   * Whether the feature should be prepaid upfront or billed for how much they use
end of billing period.
   */
  usageModel?: 'prepaid' | 'pay_per_use' | null;
}

export interface AttachParamsItemConfig {
  onDecrease?: | 'prorate' | 'prorate_immediately' | 'prorate_next_cycle' | 'none' | 'no_prorations' | null;

  onIncrease?: | 'bill_immediately' | 'prorate_immediately' | 'prorate_next_cycle' | 'bill_next_cycle' | null;

  rollover?: AttachParamsItemConfigRollover | null;
}

export interface AttachParamsItemConfigRollover {
  length: number;

  max: number | null;

  duration?: 'month' | 'forever';
}

export interface AttachParamsItemDisplay {
  primaryText: string;

  secondaryText?: string | null;
}

export interface AttachParamsItemFeature {
  /**
   * The ID of the feature, used to refer to it in other API calls like /track or
/check.
   */
  id: string;

  /**
   * The type of the feature
   */
  type: 'static' | 'boolean' | 'single_use' | 'continuous_use' | 'credit_system';

  /**
   * Whether or not the feature is archived.
   */
  archived?: boolean | null;

  /**
   * Credit cost schema for credit system features.
   */
  creditSchema?: AttachParamsItemFeatureCreditSchema[] | null;

  /**
   * Singular and plural display names for the feature.
   */
  display?: AttachParamsItemFeatureDisplay | null;

  /**
   * The name of the feature.
   */
  name?: string | null;
}

export interface AttachParamsItemFeatureCreditSchema {
  /**
   * The credit cost of the metered feature.
   */
  creditCost: number;

  /**
   * The ID of the metered feature (should be a single_use feature).
   */
  meteredFeatureId: string;
}

export interface AttachParamsItemFeatureDisplay {
  /**
   * The plural display name for the feature.
   */
  plural: string;

  /**
   * The singular display name for the feature.
   */
  singular: string;
}

export interface AttachParamsItemTier {
  /**
   * The price of the product item for this tier.
   */
  amount: number;

  /**
   * The maximum amount of usage for this tier.
   */
  to: number | 'inf';
}

export interface AttachParamsOption {
  featureId: string;

  quantity: number;

  adjustableQuantity?: boolean | null;

  internalFeatureId?: string | null;

  upcomingQuantity?: number | null;
}

export interface AttachParams {
  billingCycleAnchor?: number;

  checkoutSessionParams?: unknown;

  /**
   * Customer details to set when creating a customer
   */
  customerData?: CustomerData | null;

  enableProductImmediately?: boolean;

  entityData?: EntityData;

  entityId?: string | null;

  finalizeInvoice?: boolean;

  forceCheckout?: boolean;

  freeTrial?: AttachParamsUnionMember0 | boolean;

  invoice?: boolean;

  invoiceOnly?: boolean;

  isCustom?: boolean;

  items?: AttachParamsItem[];

  metadata?: unknown;

  newBillingSubscription?: boolean;

  options?: AttachParamsOption[] | null;

  productId?: string | null;

  productIds?: string[] | null;

  reward?: string | string[];

  setupPayment?: boolean;

  successUrl?: string;

  version?: number;

  /**
   * DEPRECATED: This field is deprecated and will be removed in a future version. Please use the checkout() method instead.
   */
  dialog?: any;

  /**
   * Whether to open checkout in a new tab
   */
  openInNewTab?: boolean;
}
