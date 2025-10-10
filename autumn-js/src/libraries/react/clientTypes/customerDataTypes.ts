// Auto-generated Zod schema
import { z } from "zod";

export const CustomerDataSchema = z.object({
  email: z.string().nullable().optional(),
  fingerprint: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  name: z.string().nullable().optional(),
  stripeId: z.string().nullable().optional()
});

export interface CustomerData {
  email?: string | null;

  fingerprint?: string | null;

  metadata?: { [key: string]: unknown } | null;

  name?: string | null;

  stripeId?: string | null;
}
