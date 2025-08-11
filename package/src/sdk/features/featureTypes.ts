import { z } from "zod";

export enum FeatureType {
  Boolean = "boolean",
  SingleUse = "single_use",
  ContinuousUse = "continuous_use",
  CreditSystem = "credit_system",
}

export const FeatureSchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  type: z.nativeEnum(FeatureType),
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
});

export type Feature = z.infer<typeof FeatureSchema>;
