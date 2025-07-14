import { z } from "zod";

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
  metadata: z.record(z.string()).optional(),
  forceCheckout: z.boolean().optional(),
  dialog: z
    .function()
    .args(z.any())
    .returns(z.union([z.custom<JSX.Element>(), z.custom<React.ReactNode>()]))
    .optional(),
  entityData: z.any().optional(),
  openInNewTab: z.boolean().optional(),
  reward: z.string().optional(),
  checkoutSessionParams: z.record(z.any()).optional(),
});

export type AttachParams = z.infer<typeof AttachParamsSchema>;

export const CheckoutParamsSchema = z.object({
  productId: z.string(),
  entityId: z.string().optional(),
  options: z.array(AttachFeatureOptionsSchema).optional(),
  dialog: z.any().optional(),
});

export type CheckoutParams = z.infer<typeof CheckoutParamsSchema>;
