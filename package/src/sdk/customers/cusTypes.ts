import type { ProductItem } from "@sdk/products/prodTypes";
import { z } from "zod/v4";
import type { AppEnv } from "../general/genEnums";
import { ProductItemInterval } from "../products/prodEnums";
import {
  CustomerExpandEnum,
  type CustomerExpandOption,
  type ProductStatus,
} from "./cusEnums";
import type { Entity } from "./entities/entTypes";

export const CoreCusFeatureSchema = z.object({
  unlimited: z.boolean().optional(),
  interval: z.enum(ProductItemInterval).optional(),
  balance: z.number().nullish(),
  usage: z.number().optional(),
  included_usage: z.number().optional(),
  next_reset_at: z.number().nullish(),
  overage_allowed: z.boolean().optional(),
  usage_limit: z.number().optional(),

  rollovers: z
    .object({
      balance: z.number(),
      expires_at: z.number(),
    })
    .optional(),

  breakdown: z
    .array(
      z.object({
        interval: z.enum(ProductItemInterval),
        balance: z.number().optional(),
        usage: z.number().optional(),
        included_usage: z.number().optional(),
        next_reset_at: z.number().optional(),
      }),
    )
    .optional(),

  credit_schema: z
    .array(
      z.object({
        feature_id: z.string(),
        credit_amount: z.number(),
      }),
    )
    .optional(),
});

export type CoreCustomerFeature = z.infer<typeof CoreCusFeatureSchema>;

export interface CustomerFeature extends CoreCustomerFeature {
  id: string;
  name: string;
  type: "static" | "single_use" | "continuous_use";
}

export interface CustomerReferral {
  program_id: string;
  customer: {
    id: string;
    name: string | null;
    email: string | null;
  };
  reward_applied: boolean;
  created_at: number;
}

export interface CustomerProduct {
  id: string;
  name: string | null;
  group: string | null;
  status: ProductStatus;
  started_at: number;
  canceled_at: number | null;
  version: number;

  subscription_ids?: string[] | null;
  current_period_start?: number | null;
  current_period_end?: number | null;

  trial_ends_at?: number;
  entity_id?: string;

  is_add_on: boolean;
  is_default: boolean;

  items: ProductItem[];
}

export interface Customer {
  // Internal fields
  id: string | null;
  created_at: number;
  name: string | null;
  email: string | null;
  fingerprint: string | null;
  stripe_id: string | null;
  env: AppEnv;
  metadata: Record<string, any>;

  products: CustomerProduct[];
  features: Record<string, CustomerFeature>;

  // Expanded fields (payment_method and referrals kept as optional fallbacks until types are finalized)
  payment_method?: any;
  referrals?: CustomerReferral[];
}

/**
 * Maps expand option strings to their corresponding types.
 * Used for conditional type expansion based on the expand parameter.
 */
export interface CustomerExpandedFields {
  invoices: CustomerInvoice[];
  entities: Entity[];
  referrals: CustomerReferral[];
  // TODO: Add proper types when defined
  rewards: unknown;
  trials_used: unknown;
  payment_method: unknown;
}

/**
 * Utility type that creates a Customer with additional expanded fields
 * based on the expand array passed to the API.
 *
 * @example
 * // Base customer without expanded fields
 * type Base = ExpandedCustomer<[]>;
 *
 * // Customer with invoices and entities expanded
 * type WithExpansion = ExpandedCustomer<['invoices', 'entities']>;
 * // Result: Customer & { invoices: CustomerInvoice[]; entities: Entity[] }
 */
export type ExpandedCustomer<
  T extends readonly CustomerExpandOption[] = readonly [],
> = Customer & {
  [K in T[number]]: CustomerExpandedFields[K];
};

export const CustomerDataSchema = z.object({
  name: z.string().nullish(),
  email: z.string().nullish(),
  fingerprint: z.string().nullish(),
});

export type CustomerData = z.infer<typeof CustomerDataSchema>;

export interface GetCustomerParams<
  T extends readonly CustomerExpandOption[] = readonly [],
> {
  expand?: T;
}

export const CreateCustomerParamsSchema = z.object({
  id: z.string().nullish(),
  email: z.string().nullish(),
  name: z.string().nullish(),
  fingerprint: z.string().nullish(),
  metadata: z.record(z.string(), z.any()).optional(),
  expand: z.array(CustomerExpandEnum).optional(),
  stripe_id: z.string().nullish(),
});

export type CreateCustomerParamsBase = z.infer<typeof CreateCustomerParamsSchema>;

/**
 * Generic version of CreateCustomerParams that preserves the expand array type
 * for proper ExpandedCustomer inference.
 */
export interface CreateCustomerParams<
  T extends readonly CustomerExpandOption[] = readonly [],
> extends Omit<CreateCustomerParamsBase, "expand"> {
  expand?: T;
}

export interface UpdateCustomerParams {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  fingerprint?: string | null;
  metadata?: Record<string, any>;
  stripe_id?: string;
}

export const BillingPortalParamsSchema = z.object({
  return_url: z.string().optional(),
});

export type BillingPortalParams = z.infer<typeof BillingPortalParamsSchema>;

export interface BillingPortalResult {
  customer_id: string;
  url: string;
}

export interface CustomerInvoice {
  product_ids: string[];
  stripe_id: string;
  status: string;
  total: number;
  currency: string;
  created_at: number;
  hosted_invoice_url: string;
}

export const UpdateBalancesParamsSchema = z
  .object({
    feature_id: z.string(),
    balance: z.number(),
  })
  .or(
    z.array(
      z.object({
        feature_id: z.string(),
        balance: z.number(),
      }),
    ),
  )
  .or(
    z.object({
      entity_id: z.string().optional(),
      balances: z.array(
        z.object({
          feature_id: z.string(),
          balance: z.number(),
        }),
      ),
    }),
  );

export const DeleteCustomerParamsSchema = z.object({
  delete_in_stripe: z.boolean().optional(),
});

export const ListCustomersParamsSchema = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type ListCustomersParams = z.infer<typeof ListCustomersParamsSchema>;
export type DeleteCustomerParams = z.infer<typeof DeleteCustomerParamsSchema>;
export type UpdateBalancesParams = z.infer<typeof UpdateBalancesParamsSchema>;
export type UpdateBalancesResult = { success: boolean };
