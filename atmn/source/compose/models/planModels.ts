// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Generated from @autumn/shared schemas
// Run `pnpm gen:atmn` to regenerate

import { z } from "zod/v4";

export const UsageTierSchema = z.object({
  to: z.union([z.number(), z.literal("inf")]),
  amount: z.number(),
});

const idRegex = /^[a-zA-Z0-9_-]+$/;


export const PlanFeatureSchema = z.object({
  feature_id: z.string(),
    granted_balance: z.number().optional(),
  unlimited: z.boolean().optional(),
  reset: z
    .object({
    interval: z.union([z.literal("one_off"), z.literal("hour"), z.literal("day"), z.literal("week"), z.literal("month"), z.literal("quarter"), z.literal("year")]),
    interval_count: z.number().optional(),
    reset_when_enabled: z.boolean().optional(),
    })
    .optional(),
  price: z
    .object({
    amount: z.number().optional(),
    tiers: z.array(UsageTierSchema).optional(),
    
    interval: z.union([z.literal("month"), z.literal("quarter"), z.literal("semi_annual"), z.literal("year")]),
    interval_count: z.number().default(1).optional(),
    
    billing_units: z.number().default(1).optional(),
    usage_model: z.union([z.literal("prepaid"), z.literal("pay_per_use")]),
    max_purchase: z.number().optional(),
    })
    .optional(),
  proration: z
    .object({
    on_increase: z.union([z.literal("prorate"), z.literal("charge_immediately")]),
    on_decrease: z.union([z.literal("prorate"), z.literal("refund_immediately"), z.literal("no_action")]),
    })
    .optional(),
  rollover: z
    .object({
    max: z.number(),
    expiry_duration_type: z.union([z.literal("month"), z.literal("forever")]),
    expiry_duration_length: z.number().optional(),
    })
    .optional()
});

export const FreeTrialSchema = z.object({
  duration_type: z.union([z.literal("day"), z.literal("month"), z.literal("year")]),
    duration_length: z.number(),
  card_required: z.boolean()
});

export const PlanSchema = z.object({
  description: z.string().nullable().default(null),
  add_on: z.boolean().default(false),
    default: z.boolean().default(false),
  price: z
    .object({
    amount: z.number(),
    interval: z.union([z.literal("month"), z.literal("quarter"), z.literal("semi_annual"), z.literal("year")]),
    })
    .optional(),
  features: z.array(PlanFeatureSchema).optional(),
    free_trial: FreeTrialSchema.nullable().optional(),
  /** Unique identifier for the plan */
  id: z.string().nonempty().regex(idRegex),
  /** Display name for the plan */
  name: z.string().nonempty(),
  /** Group for organizing plans */
  group: z.string().default("")
});


// Type aliases for literal unions
export type ResetInterval = "one_off" | "hour" | "day" | "week" | "month" | "quarter" | "year";
export type RolloverExpiryDurationType = "month" | "forever";
export type BillingInterval = "month" | "quarter" | "semi_annual" | "year";
export type BillingMethod = "prepaid" | "usage_based";
export type OnIncrease = "prorate" | "charge_immediately";
export type OnDecrease = "prorate" | "refund_immediately" | "no_action";

// Base type for PlanFeature
type PlanFeatureBase = z.infer<typeof PlanFeatureSchema>;

// Reset configuration object (for top-level reset)
type ResetConfig = {
  /** How often usage resets (e.g., 'month', 'day') */
  interval: ResetInterval;
  /** Number of intervals between resets (default: 1) */
  interval_count?: number;
};

// Proration configuration
type ProrationConfig = {
  /** Behavior when quantity increases */
  on_increase: OnIncrease;
  /** Behavior when quantity decreases */
  on_decrease: OnDecrease;
};

// Rollover configuration
type RolloverConfig = {
  /** Maximum amount that can roll over (null for unlimited) */
  max: number | null;
  /** How long rollover lasts before expiring */
  expiry_duration_type: RolloverExpiryDurationType;
  /** Duration length for rollover expiry */
  expiry_duration_length?: number;
};

// Base fields shared by all PlanFeature variants
type PlanFeatureBaseFields = {
  /** Reference to the feature being configured */
  feature_id: string;
  /** Amount of usage included in this plan */
  included?: number;
  /** Whether usage is unlimited */
  unlimited?: boolean;
  /** Proration rules for quantity changes */
  proration?: ProrationConfig;
  /** Rollover policy for unused usage */
  rollover?: RolloverConfig;
};

// Price object without interval (used with top-level reset)
type PriceWithoutInterval = {
  /** Flat price per unit */
  amount?: number;
  /** Tiered pricing structure based on usage ranges */
  tiers?: Array<{ to: number | "inf"; amount: number }>;
  /** Number of units per billing cycle */
  billing_units?: number;
  /** Billing method: 'prepaid' or 'usage_based' */
  billing_method: BillingMethod;
  /** Maximum purchasable quantity */
  max_purchase?: number;
  /** Cannot have price.interval when using top-level reset */
  interval?: never;
  interval_count?: never;
};

// Price object with interval (billing cycle configuration)
type PriceWithInterval = {
  /** Flat price per unit */
  amount?: number;
  /** Tiered pricing structure based on usage ranges */
  tiers?: Array<{ to: number | "inf"; amount: number }>;
  /** Number of units per billing cycle */
  billing_units?: number;
  /** Billing method: 'prepaid' or 'usage_based' */
  billing_method: BillingMethod;
  /** Maximum purchasable quantity */
  max_purchase?: number;
  /** Billing interval (e.g., 'month', 'day') */
  interval: ResetInterval;
  /** Number of intervals between billing cycles (default: 1) */
  interval_count?: number;
};

/**
 * Plan feature with top-level reset configuration.
 * Use this for free allocations or features that reset but aren't priced per-use.
 */
export type PlanFeatureWithReset = PlanFeatureBaseFields & {
  /** Reset configuration for usage limits */
  reset: ResetConfig;
  /** Optional pricing (cannot have price.interval when using top-level reset) */
  price?: PriceWithoutInterval;
};

/**
 * Plan feature with pricing that includes interval configuration.
 * Use this for usage-based pricing where interval determines billing cycle.
 */
export type PlanFeatureWithPriceInterval = PlanFeatureBaseFields & {
  /** Cannot have top-level reset when using price.interval */
  reset?: never;
  /** Pricing configuration with billing interval */
  price: PriceWithInterval;
};

/**
 * Plan feature without any reset configuration.
 * Use this for continuous-use features (like seats) that don't reset.
 */
export type PlanFeatureNoReset = PlanFeatureBaseFields & {
  /** No reset for continuous-use features */
  reset?: never;
  /** Optional pricing without interval */
  price?: PriceWithoutInterval;
};

/**
 * Plan feature configuration with mutually exclusive reset patterns:
 * - PlanFeatureWithReset: Top-level reset (for free allocations)
 * - PlanFeatureWithPriceInterval: price.interval (for usage-based pricing billing cycle)
 * - PlanFeatureNoReset: No reset (for continuous-use features like seats)
 */
export type PlanFeature = PlanFeatureWithReset | PlanFeatureWithPriceInterval | PlanFeatureNoReset;


// Override Plan type to use PlanFeature discriminated union
type PlanBase = z.infer<typeof PlanSchema>;
export type FreeTrial = z.infer<typeof FreeTrialSchema>;

export type Plan = {
  /** Unique identifier for the plan */
  id: string;

  /** Display name for the plan */
  name: string;

  /** Optional description explaining what this plan offers */
  description?: string | null;

  /** Grouping identifier for organizing related plans */
  group?: string;

  /** Whether this plan can be purchased alongside other plans */
  add_on?: boolean;

  /** Whether to automatically enable this plan for new customers */
  auto_enable?: boolean;

  /** Base price for the plan */
  price?: {
    /** Price in your currency (e.g., 50 for $50.00) */
    amount: number;

    /** Billing frequency */
    interval: BillingInterval | ResetInterval;  }

  /** Features included with usage limits and pricing */
  features?: PlanFeature[];

  /** Free trial period before billing begins */
  free_trial?: FreeTrial | null;
};

