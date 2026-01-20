// Auto-generated Zod schema
import { z } from "zod";

export const CustomerDataSchema = z.object({
  disableDefault: z.boolean().optional(),
  email: z.string().nullable().describe("Customer's email address").optional(),
  fingerprint: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  name: z.string().nullable().describe("Customer's name").optional(),
  stripeId: z.string().nullable().optional()
}).describe("Customer details to set when creating a customer");

/**
 * Customer details to set when creating a customer
 */
export interface CustomerData {
  disableDefault?: boolean;

  /**
   * Customer's email address
   */
  email?: string | null;

  fingerprint?: string | null;

  metadata?: { [key: string]: unknown } | null;

  /**
   * Customer's name
   */
  name?: string | null;

  stripeId?: string | null;
}
