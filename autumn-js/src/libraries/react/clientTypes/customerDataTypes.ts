// Auto-generated Zod schema
import { z } from "zod";

export const CustomerDataSchema = z.object({
  disableDefault: z.boolean().describe("Disable default products from being attached to the customer").optional(),
  email: z.string().nullable().describe("Customer's email address").optional(),
  fingerprint: z.string().nullable().describe("Unique identifier (eg, serial number) to detect duplicate customers and prevent\nfree trial abuse").optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().describe("Additional metadata for the customer").optional(),
  name: z.string().nullable().describe("Customer's name").optional(),
  stripeId: z.string().nullable().describe("Stripe customer ID if you already have one").optional()
}).describe("Used to add customer details like name or email when auto-creating a customer.");

/**
 * Used to add customer details like name or email when auto-creating a customer.
 */
export interface CustomerData {
  /**
   * Disable default products from being attached to the customer
   */
  disableDefault?: boolean;

  /**
   * Customer's email address
   */
  email?: string | null;

  /**
   * Unique identifier (eg, serial number) to detect duplicate customers and prevent
free trial abuse
   */
  fingerprint?: string | null;

  /**
   * Additional metadata for the customer
   */
  metadata?: { [key: string]: unknown } | null;

  /**
   * Customer's name
   */
  name?: string | null;

  /**
   * Stripe customer ID if you already have one
   */
  stripeId?: string | null;
}
