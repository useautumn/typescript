// Auto-generated Zod schema
import { z } from "zod";
import { CustomerDataSchema } from "./customerDataTypes";
import { EntityDataSchema } from "./entityDataTypes";
import type { CustomerData } from "./customerDataTypes";
import type { EntityData } from "./entityDataTypes";

export const CheckParamsCustomerDataSchema = z.object({
  email: z.string().nullable().optional(),
  fingerprint: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  name: z.string().nullable().optional(),
  stripeId: z.string().nullable().optional()
});

export const CheckParamsEntityDataSchema = z.object({
  featureId: z.string(),
  name: z.string().optional()
});

export const CheckParamsSchema = z.object({
  customerData: CheckParamsCustomerDataSchema.optional(),
  entityData: CheckParamsEntityDataSchema.optional(),
  entityId: z.string().optional(),
  featureId: z.string().optional(),
  productId: z.string().optional(),
  requiredBalance: z.number().optional(),
  sendEvent: z.boolean().optional(),
  withPreview: z.boolean().optional(),
  dialog: z.any().optional().describe("Dialog configuration for feature check flow"),
  properties: z.record(z.string(), z.any()).optional().describe("Additional properties for the feature check")
});

export interface CheckParamsCustomerData {
  email?: string | null;

  fingerprint?: string | null;

  metadata?: { [key: string]: unknown } | null;

  name?: string | null;

  stripeId?: string | null;
}

export interface CheckParamsEntityData {
  featureId: string;

  name?: string;
}

export interface CheckParams {
  customerData?: CheckParamsCustomerData;

  entityData?: CheckParamsEntityData;

  entityId?: string;

  featureId?: string;

  productId?: string;

  requiredBalance?: number;

  sendEvent?: boolean;

  withPreview?: boolean;

  /**
   * Dialog configuration for feature check flow
   */
  dialog?: any;

  /**
   * Additional properties for the feature check
   */
  properties?: Record<string, any>;
}
