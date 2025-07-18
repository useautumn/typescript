import { z } from "zod";

export const CancelParamsSchema = z.object({
  productId: z.string(),
  entityId: z.string().optional(),
  cancelImmediately: z.boolean().optional(),
});

export type CancelParams = z.infer<typeof CancelParamsSchema>;

// Add interfaces for function params
export const CheckParamsSchema = z.object({
  featureId: z.string().optional(),
  productId: z.string().optional(),
  entityId: z.string().optional(),
  requiredBalance: z.number().optional(),
  sendEvent: z.boolean().optional(),
  withPreview: z.boolean().optional(),
  dialog: z.any().optional(),
  entityData: z.any().optional(),
});

export type CheckParams = z.infer<typeof CheckParamsSchema>;

export const TrackParamsSchema = z.object({
  featureId: z.string().optional(),
  eventName: z.string().optional(),
  entityId: z.string().optional(),
  value: z.number().optional(),
  idempotencyKey: z.string().optional(),
  entityData: z.any().optional(),
});

export type TrackParams = z.infer<typeof TrackParamsSchema>;

export interface OpenBillingPortalParams {
  returnUrl?: string;
  openInNewTab?: boolean;
}

export interface SetupPaymentParams {
  successUrl?: string;
  checkoutSessionParams?: Record<string, any>;
  openInNewTab?: boolean;
}
