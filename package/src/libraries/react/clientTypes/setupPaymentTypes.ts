// Auto-generated Zod schema
import { z } from "zod";
import { CustomerDataSchema } from "./customerDataTypes";
import type { CustomerData } from "./customerDataTypes";

export const SetupPaymentParamsSchema = z.object({
  checkoutSessionParams: z.record(z.string(), z.unknown()).describe("Additional parameters for the checkout session").optional(),
  customerData: CustomerDataSchema.describe("Customer details to set when creating a customer").optional(),
  successUrl: z.string().describe("URL to redirect to after successful payment setup. Must start with either\nhttp:// or https://").optional(),
  openInNewTab: z.boolean().optional().describe("Whether to open payment setup in a new tab")
});

export interface SetupPaymentParams {
  /**
   * Additional parameters for the checkout session
   */
  checkoutSessionParams?: { [key: string]: unknown };

  /**
   * Customer details to set when creating a customer
   */
  customerData?: CustomerData;

  /**
   * URL to redirect to after successful payment setup. Must start with either
http:// or https://
   */
  successUrl?: string;

  /**
   * Whether to open payment setup in a new tab
   */
  openInNewTab?: boolean;
}
