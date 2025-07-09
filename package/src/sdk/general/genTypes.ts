import { CustomerData } from "../customers/cusTypes";
import { EntityData } from "../customers/entities/entTypes";
import { CheckFeatureResult, CheckProductResult } from "./checkTypes";
import { z } from "zod";

// Attach
export interface AttachFeatureOptions {
  feature_id: string;
  quantity: number;
}

export const AttachParamsSchema = z.object({
  customer_id: z.string(),
  product_id: z.string().optional(),
  entity_id: z.string().optional(),
  options: z.array(z.object({
    feature_id: z.string(),
    quantity: z.number()
  })).optional(),

  product_ids: z.array(z.string()).optional(), // If set, will attach multiple products to the customer (cannot be used with product_id)
  free_trial: z.boolean().optional(), // Default is true -- if set to false, will bypass product free trial
  success_url: z.string().optional(), // Passed to Stripe
  metadata: z.record(z.string()).optional(), // Passed to Stripe
  force_checkout: z.boolean().optional(), // Default is false -- if set to true, will force the customer to checkout (not allowed for upgrades / downgrades)

  customer_data: z.any().optional(),
  entity_data: z.any().optional(),

  checkout_session_params: z.record(z.any()).optional(), // Passed to Stripe
  reward: z.string().optional()
});

export type AttachParams = z.infer<typeof AttachParamsSchema>;

export interface CancelParams {
  customer_id: string;
  product_id: string;
  entity_id?: string;
  cancel_immediately?: boolean;
}

export interface CancelResult {
  success: boolean;
  customer_id: string;
  product_id: string;
}

export const AttachResultSchema = z.object({
  checkout_url: z.string().optional(),
  customer_id: z.string(),
  product_ids: z.array(z.string()),
  code: z.string(),
  message: z.string(),
  customer_data: z.any().optional()
});

export type AttachResult = z.infer<typeof AttachResultSchema>;

// Events
export interface TrackParams {
  customer_id: string;
  value?: number; // Defaults to 1

  feature_id?: string;
  event_name?: string;
  entity_id?: string;
  customer_data?: CustomerData;
  idempotency_key?: string;
  entity_data?: EntityData;
}

export interface TrackResult {
  id: string; // Event ID
  code: string; // Success code
  customer_id: string; // Customer ID

  feature_id?: string; // Feature ID
  event_name?: string; // Event name
}

// Entitled
export interface CheckParams {
  customer_id: string;
  feature_id?: string;
  product_id?: string;
  entity_id?: string;
  customer_data?: CustomerData;
  required_balance?: number;
  send_event?: boolean;
  with_preview?: boolean;
  entity_data?: EntityData;
}

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
