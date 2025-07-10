import { z } from "zod";

export const ProductItemIntervalEnum = z.enum([
  "minute",
  "hour",
  "day",
  "week",
  "month",
  "quarter",
  "semi_annual",
  "year",
]);

export const UsageModelEnum = z.enum(["prepaid", "pay_per_use"]);

export type ProductItemInterval = z.infer<typeof ProductItemIntervalEnum>;
export type UsageModel = z.infer<typeof UsageModelEnum>;

export const ProductItemSchema = z.object({
  type: z.enum(["feature", "priced_feature"]).nullish(),
  feature_id: z.string().nullish(),
  included_usage: z.union([z.number(), z.literal("inf")]).nullish(),
  interval: ProductItemIntervalEnum.nullish(),
  usage_model: UsageModelEnum.nullish(),
  price: z.number().nullish(),
  billing_units: z.number().nullish(), // amount per billing unit (eg. $9 / 250 units)
});

export const FeatureItemSchema = z.object({
  feature_id: z.string(),
  included_usage: z.number().nullish(),
  interval: ProductItemIntervalEnum.nullish(),
});

export const PriceItemSchema = z.object({
  price: z.number().gt(0),
  interval: ProductItemIntervalEnum.nullish(),
});

export type FeatureItem = z.infer<typeof FeatureItemSchema>;
export type PriceItem = z.infer<typeof PriceItemSchema>;
export type ProductItem = z.infer<typeof ProductItemSchema>;
