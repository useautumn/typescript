import { z } from "zod";
import { EntityDataParams } from "./clientEntTypes";

// Attach
export const AttachFeatureOptionsSchema = z.object({
  featureId: z.string(),
  quantity: z.number(),
});

export type AttachFeatureOptions = z.infer<typeof AttachFeatureOptionsSchema>;

export const AttachParamsSchema = z.object({
  productId: z.string().optional(),
  entityId: z.string().optional(),
  options: z.array(AttachFeatureOptionsSchema).optional(),
  productIds: z.array(z.string()).optional(),
  freeTrial: z.boolean().optional(),
  successUrl: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  forceCheckout: z.boolean().optional(),
  dialog: z
    .function()
    .args(z.any())
    .returns(z.union([z.custom<JSX.Element>(), z.custom<React.ReactNode>()]))
    .optional(),
  entityData: z.any().optional(),
  openInNewTab: z.boolean().optional(),
  reward: z.string().optional(),
  checkoutSessionParams: z.record(z.any()).optional(),
});

export type AttachParams = z.infer<typeof AttachParamsSchema>;

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
  dialog: z
    .function()
    .args(z.any())
    .returns(z.union([z.custom<JSX.Element>(), z.custom<React.ReactNode>()]))
    .optional(),
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
