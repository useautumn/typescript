import { z } from "zod/v4";

// ============================================
// Enums
// ============================================

export const BillingIntervalSchema = z.enum([
  "one_off",
  "week",
  "month",
  "quarter",
  "semi_annual",
  "year",
]);
export type BillingInterval = z.infer<typeof BillingIntervalSchema>;

export const ResetIntervalSchema = z.enum([
  "one_off",
  "minute",
  "hour",
  "day",
  "week",
  "month",
  "quarter",
  "semi_annual",
  "year",
]);
export type ResetInterval = z.infer<typeof ResetIntervalSchema>;

export const BillingMethodSchema = z.enum(["prepaid", "usage_based"]);
export type BillingMethod = z.infer<typeof BillingMethodSchema>;

export const OnIncreaseSchema = z.enum([
  "bill_immediately",
  "prorate_immediately",
  "prorate_next_cycle",
  "bill_next_cycle",
]);
export type OnIncrease = z.infer<typeof OnIncreaseSchema>;

export const OnDecreaseSchema = z.enum([
  "prorate",
  "prorate_immediately",
  "prorate_next_cycle",
  "none",
  "no_prorations",
]);
export type OnDecrease = z.infer<typeof OnDecreaseSchema>;

export const RolloverExpiryDurationTypeSchema = z.enum(["month", "forever"]);
export type RolloverExpiryDurationType = z.infer<typeof RolloverExpiryDurationTypeSchema>;

// ============================================
// Feature quantity for prepaid features
// ============================================

export const FeatureQuantityParamsSchema = z.object({
  feature_id: z.string(),
  quantity: z.number().min(0).optional(),
  adjustable: z.boolean().optional(),
});
export type FeatureQuantityParams = z.infer<typeof FeatureQuantityParamsSchema>;

// ============================================
// Free trial override
// ============================================

export const FreeTrialParamsSchema = z.object({
  duration_length: z.number(),
  duration_type: z.enum(["day", "month", "year"]).default("month"),
  card_required: z.boolean().default(true),
});
export type FreeTrialParams = z.infer<typeof FreeTrialParamsSchema>;

// ============================================
// Discount types
// ============================================

export const AttachDiscountSchema = z.union([
  z.object({ reward_id: z.string() }),
  z.object({ promotion_code: z.string() }),
]);
export type AttachDiscount = z.infer<typeof AttachDiscountSchema>;

// ============================================
// Invoice mode
// ============================================

export const InvoiceModeParamsSchema = z.object({
  enabled: z.boolean(),
  enable_plan_immediately: z.boolean().default(false),
  finalize: z.boolean().default(true),
});
export type InvoiceModeParams = z.infer<typeof InvoiceModeParamsSchema>;

// ============================================
// Proration behavior
// ============================================

export const ProrationBehaviorSchema = z.enum(["prorate_immediately", "none"]);
export type ProrationBehavior = z.infer<typeof ProrationBehaviorSchema>;

// ============================================
// Redirect mode
// ============================================

export const RedirectModeSchema = z.enum(["always", "if_required", "never"]);
export type RedirectMode = z.infer<typeof RedirectModeSchema>;

// ============================================
// Plan schedule timing
// ============================================

export const PlanScheduleSchema = z.enum(["immediate", "end_of_cycle"]);
export type PlanSchedule = z.infer<typeof PlanScheduleSchema>;

// ============================================
// Cancel action for update
// ============================================

export const CancelActionSchema = z.enum([
  "cancel_immediately",
  "cancel_end_of_cycle",
  "uncancel",
]);
export type CancelAction = z.infer<typeof CancelActionSchema>;

// ============================================
// Usage tier for tiered pricing
// ============================================

export const UsageTierSchema = z.object({
  to: z.number().or(z.literal("inf")),
  amount: z.number(),
});
export type UsageTier = z.infer<typeof UsageTierSchema>;

// ============================================
// Base price params (for customize.price)
// ============================================

export const BasePriceParamsSchema = z.object({
  amount: z.number(),
  interval: BillingIntervalSchema,
  interval_count: z.number().optional(),
});
export type BasePriceParams = z.infer<typeof BasePriceParamsSchema>;

// ============================================
// Plan item params (for customize.items)
// ============================================

export const CreatePlanItemParamsSchema = z.object({
  feature_id: z.string(),
  included: z.number().optional(),
  unlimited: z.boolean().optional(),

  reset: z
    .object({
      interval: ResetIntervalSchema,
      interval_count: z.number().optional(),
    })
    .optional(),

  price: z
    .object({
      amount: z.number().optional(),
      tiers: z.array(UsageTierSchema).optional(),
      interval: BillingIntervalSchema,
      interval_count: z.number().default(1).optional(),
      billing_units: z.number().default(1).optional(),
      billing_method: BillingMethodSchema,
      max_purchase: z.number().optional(),
    })
    .optional(),

  proration: z
    .object({
      on_increase: OnIncreaseSchema,
      on_decrease: OnDecreaseSchema,
    })
    .optional(),

  rollover: z
    .object({
      max: z.number().optional(),
      expiry_duration_type: RolloverExpiryDurationTypeSchema,
      expiry_duration_length: z.number().optional(),
    })
    .optional(),
});
export type CreatePlanItemParams = z.infer<typeof CreatePlanItemParamsSchema>;

// ============================================
// Customize plan (override price, items, or free trial)
// ============================================

export const CustomizePlanSchema = z.object({
  price: BasePriceParamsSchema.nullable().optional(),
  items: z.array(CreatePlanItemParamsSchema).optional(),
  free_trial: FreeTrialParamsSchema.nullable().optional(),
});
export type CustomizePlan = z.infer<typeof CustomizePlanSchema>;

// ============================================
// Custom line item (for custom invoices)
// ============================================

export const CustomLineItemSchema = z.object({
  amount: z.number(),
  description: z.string(),
});
export type CustomLineItem = z.infer<typeof CustomLineItemSchema>;

// ============================================
// Base billing params shared between attach and update
// ============================================

const BillingParamsBaseSchema = z.object({
  customer_id: z.string(),
  entity_id: z.string().optional(),
  feature_quantities: z.array(FeatureQuantityParamsSchema).optional(),
  version: z.number().optional(),
  customize: CustomizePlanSchema.optional(),
  invoice_mode: InvoiceModeParamsSchema.optional(),
  proration_behavior: ProrationBehaviorSchema.optional(),
  subscription_id: z.string().optional(),
});

// ============================================
// billing.attach params
// ============================================

export const BillingAttachParamsSchema = BillingParamsBaseSchema.extend({
  plan_id: z.string(),
  discounts: z.array(AttachDiscountSchema).optional(),
  success_url: z.string().optional(),
  redirect_mode: RedirectModeSchema.optional(),
  new_billing_subscription: z.boolean().optional(),
  plan_schedule: PlanScheduleSchema.optional(),
  checkout_session_params: z.record(z.string(), z.unknown()).optional(),
  custom_line_items: z.array(CustomLineItemSchema).optional(),
});
export type BillingAttachParams = z.infer<typeof BillingAttachParamsSchema>;

// ============================================
// billing.update params
// ============================================

export const BillingUpdateParamsSchema = BillingParamsBaseSchema.extend({
  plan_id: z.string().optional(),
  cancel_action: CancelActionSchema.optional(),
});
export type BillingUpdateParams = z.infer<typeof BillingUpdateParamsSchema>;

// ============================================
// Response types
// ============================================

export const PaymentFailureCodeSchema = z.enum([
  "3ds_required",
  "payment_method_required",
  "payment_failed",
]);
export type PaymentFailureCode = z.infer<typeof PaymentFailureCodeSchema>;

export const BillingRequiredActionSchema = z.object({
  code: PaymentFailureCodeSchema,
  reason: z.string(),
});
export type BillingRequiredAction = z.infer<typeof BillingRequiredActionSchema>;

export const BillingResponseSchema = z.object({
  customer_id: z.string(),
  entity_id: z.string().optional(),
  invoice: z
    .object({
      status: z.string().nullable(),
      stripe_id: z.string(),
      total: z.number(),
      currency: z.string(),
      hosted_invoice_url: z.string().nullable(),
    })
    .optional(),
  payment_url: z.string().nullable(),
  required_action: BillingRequiredActionSchema.optional(),
});
export type BillingResponse = z.infer<typeof BillingResponseSchema>;

// ============================================
// Multi-attach customize (without free_trial, since it's top-level)
// ============================================

export const MultiAttachCustomizePlanSchema = z.object({
  price: BasePriceParamsSchema.nullable().optional(),
  items: z.array(CreatePlanItemParamsSchema).optional(),
});
export type MultiAttachCustomizePlan = z.infer<typeof MultiAttachCustomizePlanSchema>;

// ============================================
// Multi-attach plan entry
// ============================================

export const MultiAttachPlanSchema = z.object({
  plan_id: z.string(),
  customize: MultiAttachCustomizePlanSchema.optional(),
  feature_quantities: z.array(FeatureQuantityParamsSchema).optional(),
  version: z.number().optional(),
  subscription_id: z.string().optional(),
});
export type MultiAttachPlan = z.infer<typeof MultiAttachPlanSchema>;

// ============================================
// billing.multi_attach params
// ============================================

export const MultiAttachParamsSchema = z.object({
  customer_id: z.string(),
  entity_id: z.string().optional(),
  plans: z.array(MultiAttachPlanSchema).min(1),
  free_trial: FreeTrialParamsSchema.nullable().optional(),
  invoice_mode: InvoiceModeParamsSchema.optional(),
  discounts: z.array(AttachDiscountSchema).optional(),
  success_url: z.string().optional(),
  checkout_session_params: z.record(z.string(), z.unknown()).optional(),
  redirect_mode: RedirectModeSchema.optional(),
  new_billing_subscription: z.boolean().optional(),
});
export type MultiAttachParams = z.infer<typeof MultiAttachParamsSchema>;

// ============================================
// billing.setup_payment params
// ============================================

export const SetupPaymentParamsSchema = z.object({
  customer_id: z.string(),
  entity_id: z.string().optional(),
  plan_id: z.string().optional(),
  feature_quantities: z.array(FeatureQuantityParamsSchema).optional(),
  version: z.number().optional(),
  customize: CustomizePlanSchema.optional(),
  discounts: z.array(AttachDiscountSchema).optional(),
  success_url: z.string().optional(),
  checkout_session_params: z.record(z.string(), z.unknown()).optional(),
});
export type SetupPaymentParams = z.infer<typeof SetupPaymentParamsSchema>;

// ============================================
// billing.setup_payment response
// ============================================

export const SetupPaymentResponseSchema = z.object({
  customer_id: z.string(),
  entity_id: z.string().optional(),
  url: z.string(),
});
export type SetupPaymentResponse = z.infer<typeof SetupPaymentResponseSchema>;

// ============================================
// Preview line item (for preview responses)
// ============================================

export const PreviewLineItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  amount: z.number(),
});
export type PreviewLineItem = z.infer<typeof PreviewLineItemSchema>;

// ============================================
// billing.preview_attach / billing.preview_update response
// ============================================

export const BillingPreviewResponseSchema = z.object({
  customer_id: z.string(),
  line_items: z.array(PreviewLineItemSchema),
  total: z.number(),
  currency: z.string(),
  next_cycle: z.object({
    starts_at: z.number(),
    total: z.number(),
  }).optional(),
});
export type BillingPreviewResponse = z.infer<typeof BillingPreviewResponseSchema>;
