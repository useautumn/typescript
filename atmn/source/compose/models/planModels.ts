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
  feature_id: z.string().meta({
    description: "Reference to the feature being configured",
    example: "seats",
    }),
  granted: z.number().optional().meta({
    description: "Amount of usage granted to customers",
    example: 1000,
    }),
  unlimited: z.boolean().optional().meta({
    description: "Whether usage is unlimited",
    example: false,
    }),
  reset: z
    .object({
    interval: z.union([z.literal("one_off"), z.literal("minute"), z.literal("hour"), z.literal("day"), z.literal("week"), z.literal("month"), z.literal("quarter"), z.literal("year")]).optional().meta({
    description: "How often usage resets",
    example: "month",
    }),
    interval_count: z.number().optional().meta({
    description: "Number of intervals between resets",
    example: 1,
    }),
    when_enabled: z.boolean().optional().meta({
    description: "Whether to reset usage when feature is enabled",
    example: true,
    }),
    })
    .optional()
    .meta({
    description: "Reset configuration for metered features",
    example: { interval: "month" },
    }),
  price: z
    .object({
    amount: z.number().optional().meta({
    description: "Flat price per unit in cents",
    example: 1000,
    }),
    tiers: z.array(UsageTierSchema).optional().meta({
    description: "Tiered pricing structure based on usage ranges",
    example: [{ to: 10, amount: 1000 }, { to: "inf", amount: 800 }],
    }),
    
    interval: z.union([z.literal("month"), z.literal("quarter"), z.literal("semi_annual"), z.literal("year")]).meta({
    description: "Billing frequency (cannot be used with reset.interval)",
    example: "month",
    }),
    interval_count: z.number().default(1).optional().meta({
    description: "Number of intervals between billing",
    example: 1,
    }),
    
    billing_units: z.number().default(1).optional().meta({
    description: "Number of units per billing cycle",
    example: 1,
    }),
    usage_model: z.union([z.literal("prepaid"), z.literal("pay_per_use")]).meta({
    description: "Billing model: 'prepaid' or 'pay_per_use'",
    example: "pay_per_use",
    }),
    max_purchase: z.number().optional().meta({
    description: "Maximum purchasable quantity",
    example: 100,
    }),
    })
    .optional()
    .meta({
    description: "Pricing configuration for usage-based billing",
    example: { interval: "month", usage_model: "pay_per_use" },
    }),
  proration: z
    .object({
    on_increase: z.union([z.literal("prorate"), z.literal("charge_immediately")]).meta({
    description: "Behavior when quantity increases",
    example: "prorate",
    }),
    on_decrease: z.union([z.literal("prorate"), z.literal("refund_immediately"), z.literal("no_action")]).meta({
    description: "Behavior when quantity decreases",
    example: "no_action",
    }),
    })
    .optional()
    .meta({
    description: "Proration rules for quantity changes",
    example: { on_increase: "prorate", on_decrease: "no_action" },
    }),
  rollover: z
    .object({
    max: z.number().meta({
    description: "Maximum amount that can roll over",
    example: 1000,
    }),
    expiry_duration_type: z.union([z.literal("one_off"), z.literal("minute"), z.literal("hour"), z.literal("day"), z.literal("week"), z.literal("month"), z.literal("quarter"), z.literal("year")]).meta({
    description: "How long rollover lasts before expiring",
    example: "month",
    }),
    expiry_duration_length: z.number().optional().meta({
    description: "Duration length for rollover expiry",
    example: 1,
    }),
    })
    .optional()
    .meta({
    description: "Rollover policy for unused usage",
    example: { max: 1000, expiry_duration_type: "month" },
    })
});

export const FreeTrialSchema = z.object({
  duration_type: z.union([z.literal("day"), z.literal("month"), z.literal("year")]).meta({
    description: "Unit of time: 'day', 'month', or 'year'",
    example: "day",
    }),
  duration_length: z.number().meta({
    description: "Number of duration units",
    example: 14,
    }),
  card_required: z.boolean().meta({
    description: "Whether credit card is required upfront",
    example: true,
    })
});

export const PlanSchema = z.object({
  description: z.string().nullable().default(null).meta({
    description: "Optional description explaining what this plan offers",
    example: "Perfect for growing teams",
    }),
  add_on: z.boolean().default(false).meta({
    description: "Whether this plan can be purchased alongside other plans",
    example: false,
    }),
  default: z.boolean().default(false).meta({
    description: "Whether this is the default plan for new customers",
    example: false,
    }),
  price: z
    .object({
    amount: z.number().meta({
    description: "Price in cents (e.g., 5000 for $50.00)",
    example: 5000,
    }),
    interval: z.union([z.literal("month"), z.literal("quarter"), z.literal("semi_annual"), z.literal("year")]).meta({
    description: "Billing frequency",
    example: "month",
    }),
    })
    .optional()
    .meta({
    description: "Base subscription price for the plan",
    example: { amount: 5000, interval: "month" },
    }),
  features: z.array(PlanFeatureSchema).optional().meta({
    description: "Features included with usage limits and pricing",
    example: [],
    }),
  free_trial: FreeTrialSchema.nullable().optional().meta({
    description: "Free trial period before billing begins",
    example: { duration_type: "day", duration_length: 14, card_required: true },
    }),
  /** Unique identifier for the plan */
  id: z.string().nonempty().regex(idRegex),
  /** Display name for the plan */
  name: z.string().nonempty(),
  /** Group for organizing plans */
  group: z.string().default("")
});


// Type aliases for literal unions
export type ResetInterval = "one_off" | "minute" | "hour" | "day" | "week" | "month" | "quarter" | "year";
export type BillingInterval = "month" | "quarter" | "semi_annual" | "year";
export type UsageModel = "prepaid" | "pay_per_use";
export type OnIncrease = "prorate" | "charge_immediately";
export type OnDecrease = "prorate" | "refund_immediately" | "no_action";

// Base type for PlanFeature
type PlanFeatureBase = z.infer<typeof PlanFeatureSchema>;

/**
 * Reset with interval (price cannot have interval)
 */
export type PlanFeatureWithReset = {
  /** Reference to the feature being configured */
  feature_id: string;

  /** Amount of usage granted to customers */
  granted?: number;

  /** Whether usage is unlimited */
  unlimited?: boolean;

  /** Reset configuration for metered features */
  reset: {
    /** How often usage resets */
    interval: ResetInterval;

    /** Number of intervals between resets */
    interval_count?: number;

    /** Whether to reset usage when feature is enabled */
    when_enabled?: boolean;  }

  /** Pricing configuration (interval not allowed when using reset.interval) */
  price?: {
    /** Flat price per unit in cents */
    amount?: number;

    /** Tiered pricing structure based on usage ranges */
    tiers?: Array<{ to: number | "inf"; amount: number }>;

    /** Cannot be used with reset.interval */
    interval?: never;

    /** Cannot be used with reset.interval */
    interval_count?: never;

    /** Number of units per billing cycle */
    billing_units?: number;

    /** Billing model: 'prepaid' or 'pay_per_use' */
    usage_model?: UsageModel;

    /** Maximum purchasable quantity */
    max_purchase?: number;  }

  /** Proration rules for quantity changes */
  proration?: {
    /** Behavior when quantity increases */
    on_increase: OnIncrease;

    /** Behavior when quantity decreases */
    on_decrease: OnDecrease;  }

  /** Rollover policy for unused usage */
  rollover?: {
    /** Maximum amount that can roll over */
    max: number;

    /** How long rollover lasts before expiring */
    expiry_duration_type: ResetInterval;

    /** Duration length for rollover expiry */
    expiry_duration_length?: number;  }
};

/**
 * Price with interval (reset cannot have interval)
 */
export type PlanFeatureWithPrice = {
  /** Reference to the feature being configured */
  feature_id: string;

  /** Amount of usage granted to customers */
  granted?: number;

  /** Whether usage is unlimited */
  unlimited?: boolean;

  /** Reset configuration (interval not allowed when using price.interval) */
  reset?: {
    /** Cannot be used with price.interval */
    interval?: never;

    /** Cannot be used with price.interval */
    interval_count?: never;

    /** Whether to reset usage when feature is enabled */
    when_enabled?: boolean;  }

  /** Pricing configuration for usage-based billing */
  price: {
    /** Flat price per unit in cents */
    amount?: number;

    /** Tiered pricing structure based on usage ranges */
    tiers?: Array<{ to: number | "inf"; amount: number }>;

    /** Billing frequency (cannot be used with reset.interval) */
    interval: BillingInterval;

    /** Number of intervals between billing */
    interval_count?: number;

    /** Number of units per billing cycle */
    billing_units?: number;

    /** Billing model: 'prepaid' or 'pay_per_use' */
    usage_model: UsageModel;

    /** Maximum purchasable quantity */
    max_purchase?: number;  }

  /** Proration rules for quantity changes */
  proration?: {
    /** Behavior when quantity increases */
    on_increase: OnIncrease;

    /** Behavior when quantity decreases */
    on_decrease: OnDecrease;  }

  /** Rollover policy for unused usage */
  rollover?: {
    /** Maximum amount that can roll over */
    max: number;

    /** How long rollover lasts before expiring */
    expiry_duration_type: ResetInterval;

    /** Duration length for rollover expiry */
    expiry_duration_length?: number;  }
};

/**
 * Neither has interval
 */
export type PlanFeatureBasic = {
  /** Reference to the feature being configured */
  feature_id: string;

  /** Amount of usage granted to customers */
  granted?: number;

  /** Whether usage is unlimited */
  unlimited?: boolean;

  /** Reset configuration (no interval) */
  reset?: {
    /** Not allowed in this variant */
    interval?: never;

    /** Not allowed in this variant */
    interval_count?: never;

    /** Whether to reset usage when feature is enabled */
    when_enabled?: boolean;  }

  /** Pricing configuration (no interval) */
  price?: {
    /** Flat price per unit in cents */
    amount?: number;

    /** Tiered pricing structure based on usage ranges */
    tiers?: Array<{ to: number | "inf"; amount: number }>;

    /** Not allowed in this variant */
    interval?: never;

    /** Not allowed in this variant */
    interval_count?: never;

    /** Number of units per billing cycle */
    billing_units?: number;

    /** Billing model: 'prepaid' or 'pay_per_use' */
    usage_model?: UsageModel;

    /** Maximum purchasable quantity */
    max_purchase?: number;  }

  /** Proration rules for quantity changes */
  proration?: {
    /** Behavior when quantity increases */
    on_increase: OnIncrease;

    /** Behavior when quantity decreases */
    on_decrease: OnDecrease;  }

  /** Rollover policy for unused usage */
  rollover?: {
    /** Maximum amount that can roll over */
    max: number;

    /** How long rollover lasts before expiring */
    expiry_duration_type: ResetInterval;

    /** Duration length for rollover expiry */
    expiry_duration_length?: number;  }
};

/**
 * Plan feature configuration with compile-time mutual exclusivity validation. Use reset.interval OR price.interval, but not both.
 */
export type PlanFeature = PlanFeatureWithReset | PlanFeatureWithPrice | PlanFeatureBasic;


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

  /** Whether this is the default plan for new customers */
  default?: boolean;

  /** Base price for the plan */
  price?: {
    /** Price in your currency (e.g., 50 for $50.00) */
    amount: number;

    /** Billing frequency */
    interval: BillingInterval;  }

  /** Features included with usage limits and pricing */
  features?: PlanFeature[];

  /** Free trial period before billing begins */
  free_trial?: FreeTrial | null;
};

