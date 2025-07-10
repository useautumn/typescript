import { z } from "zod";

export enum ProductItemInterval {
  // Reset interval
  Minute = "minute",
  Hour = "hour",
  Day = "day",
  Week = "week",

  // Billing interval
  Month = "month",
  Quarter = "quarter",
  SemiAnnual = "semi_annual",
  Year = "year",
}

export enum UsageModel {
  Prepaid = "prepaid",
  PayPerUse = "pay_per_use",
}

export const ProductItemSchema = z.object({
  // Feature stuff
  type: z.enum(["feature", "priced_feature"]).nullish(),
  feature_id: z.string().nullish(),
  included_usage: z.union([z.number(), z.literal("inf")]).nullish(),
  interval: z.nativeEnum(ProductItemInterval).nullish(),

  // Price config
  usage_model: z.nativeEnum(UsageModel).nullish(),
  price: z.number().nullish(),
  billing_units: z.number().nullish(), // amount per billing unit (eg. $9 / 250 units)
});

export const ProductSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  is_add_on: z.boolean().default(false).optional(),
  is_default: z.boolean().default(false).optional(),
  items: z.array(ProductItemSchema),
});

export const FeatureSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  type: z.enum(["boolean", "continuous_use", "credit_system", "metered"]),

  display: z.object({
    singular: z.string(),
    plural: z.string(),
  }),

  credit_schema: z
    .array(
      z.object({
        metered_feature_id: z.string(),
        credit_cost: z.number(),
      })
    )
    .nullish(),
});

export type ProductItem = z.infer<typeof ProductItemSchema>;
export type Feature = z.infer<typeof FeatureSchema>;
export type Product = z.infer<typeof ProductSchema>;
