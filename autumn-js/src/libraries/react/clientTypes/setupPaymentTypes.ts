// Auto-generated Zod schema
import { z } from "zod";

export const SetupPaymentParamsSchema = z.object({
  checkoutSessionParams: z.record(z.string(), z.unknown()).optional(),
  successUrl: z.string().optional(),
  openInNewTab: z.boolean().optional().describe("Whether to open payment setup in a new tab")
});

export interface SetupPaymentParams {
  checkoutSessionParams?: { [key: string]: unknown };

  successUrl?: string;

  /**
   * Whether to open payment setup in a new tab
   */
  openInNewTab?: boolean;
}
