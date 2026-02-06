// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Generated from @autumn/shared schemas
// Run `pnpm gen:atmn` to regenerate

import { z } from "zod/v4";


export const FeatureSchema = z.object({
  id: z.string(),
    name: z.string(),
  event_names: z.array(z.string()).optional(),
    credit_schema: z
    .array(
    z.object({
    metered_feature_id: z.string(),
    credit_cost: z.number(),
    }),
    )
    .optional()
});



// Base fields shared by all feature types
type FeatureBase = {
  /** Unique identifier for the feature */
  id: string;
  /** Display name for the feature */
  name: string;
  /** Event names that trigger this feature */
  event_names?: string[];
  /** Credit schema for credit_system features */
  credit_schema?: Array<{
    metered_feature_id: string;
    credit_cost: number;
  }>;
};

/** Boolean feature - no consumable field allowed */
export type BooleanFeature = FeatureBase & {
  type: "boolean";
  consumable?: never;
};

/** Metered feature - requires consumable field */
export type MeteredFeature = FeatureBase & {
  type: "metered";
  /** Whether usage is consumed (true) or accumulated (false) */
  consumable: boolean;
};

/** Credit system feature - always consumable */
export type CreditSystemFeature = FeatureBase & {
  type: "credit_system";
  /** Credit systems are always consumable */
  consumable?: true;
  /** Required: defines how credits map to metered features */
  credit_schema: Array<{
    metered_feature_id: string;
    credit_cost: number;
  }>;
};

/**
 * Feature definition with type-safe constraints:
 * - Boolean features cannot have consumable
 * - Metered features require consumable (true = single_use style, false = continuous_use style)
 * - Credit system features are always consumable and require credit_schema
 */
export type Feature = BooleanFeature | MeteredFeature | CreditSystemFeature;

