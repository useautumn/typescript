// Auto-generated Zod schema
import { z } from "zod";
import { CustomerDataSchema } from "./customerDataTypes";
import { EntityDataSchema } from "./entityDataTypes";
import type { CustomerData } from "./customerDataTypes";
import type { EntityData } from "./entityDataTypes";

export const CheckoutParamsOptionSchema = z.object({
  featureId: z.string(),
  quantity: z.number(),
  adjustableQuantity: z.boolean().nullable().optional(),
  internalFeatureId: z.string().nullable().optional(),
  upcomingQuantity: z.number().nullable().optional()
});

export const CheckoutParamsSchema = z.object({
  checkoutSessionParams: z.unknown().optional(),
  customerData: CustomerDataSchema.describe("Customer data if using attach to auto create customer").optional(),
  entityData: EntityDataSchema.describe("Entity data for creating an entity").optional(),
  entityId: z.string().nullable().optional(),
  forceCheckout: z.boolean().optional(),
  freeTrial: z.boolean().optional(),
  invoice: z.boolean().optional(),
  options: z.array(CheckoutParamsOptionSchema).nullable().optional(),
  productId: z.string().nullable().optional(),
  productIds: z.array(z.string()).nullable().optional(),
  reward: z.union([z.string(), z.array(z.string())]).optional(),
  setupPayment: z.boolean().optional(),
  skipCheckout: z.boolean().optional(),
  successUrl: z.string().optional(),
  dialog: z.any().optional().describe("Dialog configuration for checkout flow"),
  openInNewTab: z.boolean().optional().describe("Whether to open checkout in a new tab")
});

export interface CheckoutParamsOption {
  featureId: string;

  quantity: number;

  adjustableQuantity?: boolean | null;

  internalFeatureId?: string | null;

  upcomingQuantity?: number | null;
}

export interface CheckoutParams {
  checkoutSessionParams?: unknown;

  /**
   * Customer data if using attach to auto create customer
   */
  customerData?: CustomerData;

  /**
   * Entity data for creating an entity
   */
  entityData?: EntityData;

  entityId?: string | null;

  forceCheckout?: boolean;

  freeTrial?: boolean;

  invoice?: boolean;

  options?: CheckoutParamsOption[] | null;

  productId?: string | null;

  productIds?: string[] | null;

  reward?: string | Array<string>;

  setupPayment?: boolean;

  skipCheckout?: boolean;

  successUrl?: string;

  /**
   * Dialog configuration for checkout flow
   */
  dialog?: any;

  /**
   * Whether to open checkout in a new tab
   */
  openInNewTab?: boolean;
}
