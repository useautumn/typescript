// Auto-generated Zod schema
import { z } from "zod";

export const EntityDataSchema = z.object({
  featureId: z.string(),
  name: z.string().optional()
});

export interface EntityData {
  featureId: string;

  name?: string;
}
