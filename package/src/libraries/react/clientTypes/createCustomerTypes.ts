// Auto-generated Zod schema
import { z } from "zod";
import { EntityDataSchema } from "./entityDataTypes";
import type { EntityData } from "./entityDataTypes";

export const CustomerCreateParamsSchema = z.object({
  expand: z.union([z.unknown(), z.literal('invoices'), z.literal('trials_used'), z.literal('rewards'), z.literal('entities'), z.literal('referrals'), z.literal('payment_method'), z.literal('upcoming_invoice'), z.literal('subscriptions.plan'), z.literal('scheduled_subscriptions.plan'), z.unknown()]).describe("Query param").optional(),
  withAutumnId: z.boolean().describe("Query param").optional(),
  disableDefault: z.boolean().describe("Body param").optional(),
  email: z.string().nullable().describe("Body param: Customer's email address").optional(),
  entityData: EntityDataSchema.describe("Body param").optional(),
  entityId: z.string().describe("Body param").optional(),
  fingerprint: z.string().describe("Body param: Unique identifier (eg, serial number) to detect duplicate customers\nand prevent free trial abuse").optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().describe("Body param: Additional metadata for the customer").optional(),
  name: z.string().nullable().describe("Body param: Customer's name").optional(),
  stripeId: z.string().describe("Body param: Stripe customer ID if you already have one").optional(),
  errorOnNotFound: z.boolean().optional().describe("Whether to return an error if customer is not found")
});

export interface CustomerCreateParams {
  /**
   * Query param
   */
  expand?: (| 'invoices' | 'trials_used' | 'rewards' | 'entities' | 'referrals' | 'payment_method' | 'upcoming_invoice' | 'subscriptions.plan' | 'scheduled_subscriptions.plan' | 'balances.feature')[];

  /**
   * Query param
   */
  withAutumnId?: boolean;

  /**
   * Body param
   */
  disableDefault?: boolean;

  /**
   * Body param: Customer's email address
   */
  email?: string | null;

  /**
   * Body param
   */
  entityData?: EntityData;

  /**
   * Body param
   */
  entityId?: string;

  /**
   * Body param: Unique identifier (eg, serial number) to detect duplicate customers
and prevent free trial abuse
   */
  fingerprint?: string;

  /**
   * Body param: Additional metadata for the customer
   */
  metadata?: { [key: string]: unknown } | null;

  /**
   * Body param: Customer's name
   */
  name?: string | null;

  /**
   * Body param: Stripe customer ID if you already have one
   */
  stripeId?: string;

  /**
   * Whether to return an error if customer is not found
   */
  errorOnNotFound?: boolean;
}
