// Auto-generated Zod schema
import { z } from "zod";
import { CustomerDataSchema } from "./customerDataTypes";
import { EntityDataSchema } from "./entityDataTypes";
import type { CustomerData } from "./customerDataTypes";
import type { EntityData } from "./entityDataTypes";

export const AttachParamsCustomerDataSchema = z.object({
  email: z.string().nullable().optional(),
  fingerprint: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  name: z.string().nullable().optional(),
  stripeId: z.string().nullable().optional()
});

export const AttachParamsEntityDataSchema = z.object({
  featureId: z.string(),
  name: z.string().optional()
});

export const AttachParamsOptionSchema = z.object({
  featureId: z.string(),
  quantity: z.number(),
  adjustableQuantity: z.boolean().nullable().optional(),
  internalFeatureId: z.string().nullable().optional(),
  upcomingQuantity: z.number().nullable().optional()
});

export const AttachParamsSchema = z.object({
  checkoutSessionParams: z.unknown().optional(),
  customerData: AttachParamsCustomerDataSchema.optional(),
  entityData: AttachParamsEntityDataSchema.optional(),
  entityId: z.string().nullable().optional(),
  forceCheckout: z.boolean().optional(),
  freeTrial: z.boolean().optional(),
  invoice: z.boolean().optional(),
  options: z.array(AttachParamsOptionSchema).nullable().optional(),
  productId: z.string().nullable().optional(),
  productIds: z.array(z.string()).nullable().optional(),
  reward: z.union([z.string(), z.array(z.string())]).optional(),
  setupPayment: z.boolean().optional(),
  successUrl: z.string().optional(),
  dialog: z.any().optional().describe("DEPRECATED: This field is deprecated and will be removed in a future version. Please use the checkout() method instead."),
  openInNewTab: z.boolean().optional().describe("Whether to open checkout in a new tab"),
  metadata: z.record(z.string(), z.string()).optional().describe("Additional metadata for the request")
});

export interface AttachParamsCustomerData {
  email?: string | null;

  fingerprint?: string | null;

  metadata?: { [key: string]: unknown } | null;

  name?: string | null;

  stripeId?: string | null;
}

export interface AttachParamsEntityData {
  featureId: string;

  name?: string;
}

export interface AttachParamsOption {
  featureId: string;

  quantity: number;

  adjustableQuantity?: boolean | null;

  internalFeatureId?: string | null;

  upcomingQuantity?: number | null;
}

export interface AttachParams {
  checkoutSessionParams?: unknown;

  customerData?: AttachParamsCustomerData;

  entityData?: AttachParamsEntityData;

  entityId?: string | null;

  forceCheckout?: boolean;

  freeTrial?: boolean;

  invoice?: boolean;

  options?: AttachParamsOption[] | null;

  productId?: string | null;

  productIds?: string[] | null;

  reward?: string | Array<string>;

  setupPayment?: boolean;

  successUrl?: string;

  /**
   * DEPRECATED: This field is deprecated and will be removed in a future version. Please use the checkout() method instead.
   */
  dialog?: any;

  /**
   * Whether to open checkout in a new tab
   */
  openInNewTab?: boolean;

  /**
   * Additional metadata for the request
   */
  metadata?: Record<string, any>;
}
