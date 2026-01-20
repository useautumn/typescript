import { z } from "zod/v4";
import { CoreCusFeatureSchema } from "../../sdk";
import type { UsageModelType } from "../products/prodEnums";
import type { Product } from "../products/prodTypes";

export type CheckFeatureScenario = "usage_limit" | "feature_flag";

export const CheckFeatureResultSchema = z
  .object({
    allowed: z.boolean(),
    feature_id: z.string(),
    customer_id: z.string(),
    entity_id: z.string().optional(),
    required_balance: z.number(),
  })
  .extend(CoreCusFeatureSchema.shape);

export type CheckFeatureResult = z.infer<typeof CheckFeatureResultSchema>;
// export interface CheckFeatureResult extends CoreCustomerFeature {
//   allowed: boolean;
//   feature_id: string;
//   customer_id: string;
//   entity_id?: string;
//   required_balance: number;
//   preview?: CheckFeaturePreview;
// }

export interface CheckFeaturePreview {
  scenario: CheckFeatureScenario;
  title: string;
  message: string;
  feature_id: string;
  feature_name: string;
  products: Product[];
}

export type ProductScenario =
  | "scheduled"
  | "active"
  | "new"
  | "renew"
  | "upgrade"
  | "downgrade"
  | "cancel";

export interface CheckProductResult {
  allowed: boolean;
  customer_id: string;
  product_id: string;
  entity_id?: string;
  status?: string;
  preview?: CheckProductPreview;
}

export interface CheckProductPreview {
  scenario: ProductScenario;
  product_id: string;
  product_name: string;
  recurring: boolean;
  error_on_attach?: boolean;
  next_cycle_at?: number;
  current_product_name?: string;

  items?: {
    price: string;
    description: string;
    usage_model?: UsageModelType;
  }[];

  options?: {
    feature_id: string;
    feature_name: string;
    billing_units: number;
    price?: number;
    tiers?: {
      to: number | string;
      amount: number;
    }[];
  }[];

  due_today?: {
    price: number;
    currency: string;
  };

  due_next_cycle?: {
    price: number;
    currency: string;
  };
}
