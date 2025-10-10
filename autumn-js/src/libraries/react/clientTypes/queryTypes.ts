// Auto-generated Zod schema
import { z } from "zod";

export const QueryParamsSchema = z.object({
  featureId: z.union([z.string(), z.array(z.string())]),
  range: z.union([z.literal('24h'), z.literal('7d'), z.literal('30d'), z.literal('90d'), z.literal('last_cycle')]).nullable().optional()
});

export interface QueryParams {
  featureId: string | Array<string>;

  range?: '24h' | '7d' | '30d' | '90d' | 'last_cycle' | null;
}
