import { CustomerDataSchema } from "@sdk/customers/cusTypes";
import { Product, ProductItem } from "@sdk/products/prodTypes";
import { z } from "zod";
// Attach
export const AttachFeatureOptionsSchema = z.object({
  feature_id: z.string(),
  quantity: z.number(),
});
export type AttachFeatureOptions = z.infer<typeof AttachFeatureOptionsSchema>;

export const AttachParamsSchema = z.object({
  customer_id: z.string(),
  product_id: z.string().optional(),
  entity_id: z.string().optional(),
  options: z.array(AttachFeatureOptionsSchema).optional(),

  product_ids: z.array(z.string()).optional(),
  free_trial: z.boolean().optional(),
  success_url: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  force_checkout: z.boolean().optional(),

  customer_data: CustomerDataSchema.optional(),
  entity_data: z.any().optional(),

  checkout_session_params: z.record(z.any()).optional(),
  reward: z.string().optional(),
});

export type AttachParams = z.infer<typeof AttachParamsSchema>;

export const AttachResultSchema = z.object({
  checkout_url: z.string().optional(),
  customer_id: z.string(),
  product_ids: z.array(z.string()),
  code: z.string(),
  message: z.string(),
  customer_data: z.any().optional(),
});

export type AttachResult = z.infer<typeof AttachResultSchema>;

export const CheckoutParamsSchema = z.object({
  customer_id: z.string(),
  product_id: z.string(),
  entity_id: z.string().optional(),
  success_url: z.string().optional(),

  customer_data: CustomerDataSchema.optional(),
  options: z.array(AttachFeatureOptionsSchema).optional(),
});

export type CheckoutParams = z.infer<typeof CheckoutParamsSchema>;

export type CheckoutResult = {
  url?: string;
  customer_id: string;
  has_prorations: boolean;
  lines: {
    description: string;
    amount: number;
    item: ProductItem;
  }[];
  total: number;
  currency: string;
  options: AttachFeatureOptions[];
  product: Product;
  current_product: Product;
  next_cycle?: {
    starts_at: number;
    total: number;
  };
};
