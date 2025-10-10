// Auto-generated Zod schema
import { z } from "zod";
import { EntityDataSchema } from "./entityDataTypes";
import type { EntityData } from "./entityDataTypes";

export const CustomerCreateParamsEntityDataSchema = z.object({
  featureId: z.string(),
  name: z.string().optional()
});

export const CustomerCreateParamsSchema = z.object({
  expand: z.union([z.unknown(), z.literal('trials_used'), z.literal('rewards'), z.literal('entities'), z.literal('referrals'), z.literal('payment_method'), z.unknown()]).describe("Query param:").optional(),
  email: z.string().nullable().describe("Body param:").optional(),
  entityData: CustomerCreateParamsEntityDataSchema.describe("Body param:").optional(),
  entityId: z.string().describe("Body param:").optional(),
  fingerprint: z.string().describe("Body param:").optional(),
  metadata: z.record(z.string(), z.unknown()).describe("Body param:").optional(),
  name: z.string().nullable().describe("Body param:").optional(),
  stripeId: z.string().describe("Body param:").optional(),
  errorOnNotFound: z.boolean().optional().describe("Whether to return an error if customer is not found")
});

export interface CustomerCreateParamsEntityData {
  featureId: string;

  name?: string;
}

export interface CustomerCreateParams {
  /**
   * Query param:
   */
  expand?: ('invoices' | 'trials_used' | 'rewards' | 'entities' | 'referrals' | 'payment_method' | 'upcoming_invoice')[];

  /**
   * Body param:
   */
  email?: string | null;

  /**
   * Body param:
   */
  entityData?: CustomerCreateParamsEntityData;

  /**
   * Body param:
   */
  entityId?: string;

  /**
   * Body param:
   */
  fingerprint?: string;

  /**
   * Body param:
   */
  metadata?: { [key: string]: unknown };

  /**
   * Body param:
   */
  name?: string | null;

  /**
   * Body param:
   */
  stripeId?: string;

  /**
   * Whether to return an error if customer is not found
   */
  errorOnNotFound?: boolean;
}
