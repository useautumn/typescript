// Auto-generated Zod schema
import { z } from "zod";

export const BillingPortalParamsSchema = z.object({
  returnUrl: z.string().describe("Time range for the query (defaults to last_cycle if not provided)").optional(),
  openInNewTab: z.boolean().optional().describe("Whether to open billing portal in a new tab")
});

export interface BillingPortalParams {
  /**
   * Time range for the query (defaults to last_cycle if not provided)
   */
  returnUrl?: string;

  /**
   * Whether to open billing portal in a new tab
   */
  openInNewTab?: boolean;
}
