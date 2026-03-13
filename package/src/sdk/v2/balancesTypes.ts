import { z } from "zod/v4";

// ============================================
// Reset interval enum
// ============================================

export const V2ResetIntervalSchema = z.enum([
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
export type V2ResetInterval = z.infer<typeof V2ResetIntervalSchema>;

// ============================================
// v2 balances.update params
// ============================================

export const V2UpdateBalanceParamsSchema = z.object({
  customer_id: z.string(),
  feature_id: z.string(),
  entity_id: z.string().optional(),

  remaining: z.number().optional(),
  add_to_balance: z.number().optional(),
  usage: z.number().optional(),

  interval: V2ResetIntervalSchema.optional(),
  included_grant: z.number().optional(),
  balance_id: z.string().optional(),
  next_reset_at: z.number().optional(),
});
export type V2UpdateBalanceParams = z.infer<typeof V2UpdateBalanceParamsSchema>;

// ============================================
// v2 balances.update response
// ============================================

export const V2UpdateBalanceResponseSchema = z.object({
  message: z.string(),
});
export type V2UpdateBalanceResponse = z.infer<typeof V2UpdateBalanceResponseSchema>;

// ============================================
// Finalize lock action enum
// ============================================

export const V2FinalizeLockActionSchema = z.enum(["confirm", "release"]);
export type V2FinalizeLockAction = z.infer<typeof V2FinalizeLockActionSchema>;

// ============================================
// v2 balances.finalize params
// ============================================

export const V2FinalizeLockParamsSchema = z.object({
  lock_id: z.string(),
  action: V2FinalizeLockActionSchema,
  override_value: z.number().optional(),
  properties: z.record(z.string(), z.any()).optional(),
});
export type V2FinalizeLockParams = z.infer<typeof V2FinalizeLockParamsSchema>;

// ============================================
// v2 balances.finalize response
// ============================================

export const V2FinalizeLockResponseSchema = z.object({
  success: z.literal(true),
});
export type V2FinalizeLockResponse = z.infer<typeof V2FinalizeLockResponseSchema>;
