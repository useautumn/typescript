import { z } from "zod/v4";

export const AttachFeatureOptionsSchema = z.object({
  featureId: z.string(),
  quantity: z.number(),
});

export type AttachFeatureOptions = z.infer<typeof AttachFeatureOptionsSchema>;

export const AttachParamsSchema = z.object({
  productId: z.string().optional(),
  entityId: z.string().optional(),
  options: z.array(AttachFeatureOptionsSchema).optional(),
  productIds: z.array(z.string()).optional(),
  freeTrial: z.boolean().optional(),
  successUrl: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  forceCheckout: z.boolean().optional(),

  /**
   * @deprecated This field is deprecated and will be removed in a future version.
   */
  dialog: z
    .any()
    .optional()
    .describe(
      "DEPRECATED: This field is deprecated and will be removed in a future version. Please use the checkout() method instead."
    ),
  entityData: z.any().optional(),
  openInNewTab: z.boolean().optional(),
  reward: z.string().optional(),
  checkoutSessionParams: z.record(z.string(), z.any()).optional(),
});

export type AttachParams = z.infer<typeof AttachParamsSchema>;

export const CheckoutParamsSchema = z.object({
  productId: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  entityId: z.string().optional(),
  entityData: z.any().optional(),

  options: z.array(AttachFeatureOptionsSchema).optional(),
  successUrl: z.string().optional(),
  openInNewTab: z.boolean().optional(),
  dialog: z.any().optional(),
  forceCheckout: z.boolean().optional(),

  checkoutSessionParams: z.record(z.string(), z.any()).optional(),
  reward: z.string().optional(),
});

export type CheckoutParams = z.infer<typeof CheckoutParamsSchema>;

// export type CheckoutParams = {
//   productId: string;
//   entityId?: string;
//   options?: AttachFeatureOptions[];
//   successUrl?: string;
//   dialog?: any;
//   openInNewTab?: boolean;
// };
