// Auto-generated Zod schema
import { z } from "zod";

export const CancelParamsSchema = z.object({
  productId: z.string(),
  cancelImmediately: z.boolean().optional(),
  entityId: z.string().nullable().optional(),
  prorate: z.boolean().nullable().optional()
});

export interface CancelParams {
  productId: string;

  cancelImmediately?: boolean;

  entityId?: string | null;

  prorate?: boolean | null;
}
