import type { CustomerData } from "../customers/cusTypes";
import { EntityDataSchema } from "../customers/entities/entTypes";
import type { CheckFeatureResult, CheckProductResult } from "./checkTypes";
import { z } from "zod/v4";

export const CancelParamsSchema = z.object({
  customer_id: z.string(),
  product_id: z.string(),
  entity_id: z.string().optional(),
  cancel_immediately: z.boolean().optional(),
});

export type CancelParams = z.infer<typeof CancelParamsSchema>;

export const CancelResultSchema = z.object({
  success: z.boolean(),
  customer_id: z.string(),
  product_id: z.string(),
});

export type CancelResult = z.infer<typeof CancelResultSchema>;

// Events
export const TrackParamsSchema = z.object({
  customer_id: z.string(),
  value: z.number().optional(),
  feature_id: z.string().optional(),
  event_name: z.string().optional(),
  entity_id: z.string().optional(),
  customer_data: z.any().optional(),
  idempotency_key: z.string().optional(),
  entity_data: z.any().optional(),
});

export type TrackParams = z.infer<typeof TrackParamsSchema>;

export const TrackResultSchema = z.object({
  id: z.string(),
  code: z.string(),
  customer_id: z.string(),
  feature_id: z.string().optional(),
  event_name: z.string().optional(),
});

export type TrackResult = z.infer<typeof TrackResultSchema>;

export const CheckParamsSchema = z.object({
  customer_id: z.string(),
  feature_id: z.string().optional(),
  product_id: z.string().optional(),
  entity_id: z.string().optional(),
  customer_data: z.any().optional(),
  required_balance: z.number().optional(),
  send_event: z.boolean().optional(),
  with_preview: z.boolean().optional(),
  entity_data: EntityDataSchema.optional(),
});

export type CheckParams = z.infer<typeof CheckParamsSchema>;

export type CheckResult = CheckFeatureResult & CheckProductResult;

export interface UsageParams {
  customer_id: string;
  feature_id: string;
  value: number;
  customer_data?: CustomerData;
}

export interface UsageResult {
  code: string; // Success code
  customer_id: string; // Customer ID
  feature_id: string; // Feature ID
}

export interface SetupPaymentParams {
  customer_id: string;
  success_url?: string;
  checkout_session_params?: Record<string, any>;
}

export interface SetupPaymentResult {
  customer_id: string;
  url: string;
}

export const QueryRangeEnum = z.enum(["24h", "7d", "30d", "90d", "last_cycle"]);
export const QueryParamsSchema = z.object({
  customer_id: z.string(),
  feature_id: z.string().or(z.array(z.string())),
  range: QueryRangeEnum.optional(),
});

export type QueryParams = z.infer<typeof QueryParamsSchema>;

export type QueryResult = {
  list: Array<
    {
      period: string;
    } & {
      [key: string]: number;
    }
  >;
};
