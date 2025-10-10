// Auto-generated Zod schema
import { z } from "zod";

export const BillingPortalParamsSchema = z.object({
  returnUrl: z.string().optional(),
  openInNewTab: z.boolean().optional().describe("Whether to open billing portal in a new tab")
});

export interface BillingPortalParams {
  returnUrl?: string;

  /**
   * Whether to open billing portal in a new tab
   */
  openInNewTab?: boolean;
}
