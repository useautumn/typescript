import { z } from "zod/v4";

export enum FeatureType {
  Boolean = "boolean",
  SingleUse = "single_use",
  ContinuousUse = "continuous_use",
  CreditSystem = "credit_system",
}

export const FeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(FeatureType),
  display: z
    .object({
      singular: z.string(),
      plural: z.string(),
    })
    .nullish(),

  credit_schema: z
    .array(
      z.object({
        metered_feature_id: z.string(),
        credit_cost: z.number(),
      })
    )
    .nullish(),
  archived: z.boolean(),
});

export type Feature = z.infer<typeof FeatureSchema>;
