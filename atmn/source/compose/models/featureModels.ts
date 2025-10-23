// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Generated from @autumn/shared schemas
// Run `pnpm gen:atmn` to regenerate

import { z } from "zod/v4";


export const FeatureSchema = z.object({
  id: z.string().meta({
    description: "The unique identifier of the feature",
    example: "<string>",
    }),
  name: z.string().nullish().meta({
    description: "The name of the feature",
    example: "<string>",
    }),
  credit_schema: z
    .array(
    z.object({
    metered_feature_id: z.string(),
    credit_cost: z.number(),
    }),
    )
    .nullish()
    .meta({
    description: "Credit cost schema for credit system features",
    example: [{ metered_feature_id: "<string>", credit_cost: 123 }],
    }),
  archived: z.boolean().nullish().meta({
    description: "Whether or not the feature is archived",
    example: false,
    }),
  /** The type of the feature (boolean, single_use, continuous_use, credit_system) */
  type: z.string()
});

export type Feature = z.infer<typeof FeatureSchema>;

