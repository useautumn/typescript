// Auto-generated Zod schema
import { z } from "zod";

export const BillingPortalParamsSchema = z.object({
  configurationId: z.string().describe("Stripe billing portal configuration ID. Create configurations in your Stripe\ndashboard.").optional(),
  returnUrl: z.string().describe("URL to redirect to when back button is clicked in the billing portal").optional(),
  openInNewTab: z.boolean().optional().describe("Whether to open billing portal in a new tab")
});

export interface BillingPortalParams {
  /**
   * Stripe billing portal configuration ID. Create configurations in your Stripe
dashboard.
   */
  configurationId?: string;

  /**
   * URL to redirect to when back button is clicked in the billing portal
   */
  returnUrl?: string;

  /**
   * Whether to open billing portal in a new tab
   */
  openInNewTab?: boolean;
}
