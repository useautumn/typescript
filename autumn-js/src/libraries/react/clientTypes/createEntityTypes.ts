// Auto-generated Zod schema
import { z } from "zod";

export const EntityCreateParamsSchema = z.object({
  id: z.string(),
  featureId: z.string(),
  name: z.string().nullable().optional()
});

export interface EntityCreateParams {
  id: string;

  featureId: string;

  name?: string | null;
}
