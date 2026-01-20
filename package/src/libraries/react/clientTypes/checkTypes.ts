// Auto-generated Zod schema
import { z } from "zod";
import { CustomerDataSchema } from "./customerDataTypes";
import { EntityDataSchema } from "./entityDataTypes";
import type { CustomerData } from "./customerDataTypes";
import type { EntityData } from "./entityDataTypes";

export const CheckParamsSchema = z.object({
  featureId: z.string().describe("ID of the feature to check access to. Required if product_id is not provided."),
  customerData: CustomerDataSchema.describe("Properties used if customer is automatically created. Will also update if the\nname or email is not already set.").optional(),
  entityData: EntityDataSchema.optional(),
  entityId: z.string().describe("If using entity balances (eg, seats), the entity ID to check access for.").optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  requiredBalance: z.number().describe("If you know the amount of the feature the end user is consuming in advance. If\ntheir balance is below this quantity, allowed will be false.").optional(),
  sendEvent: z.boolean().describe("If true, a usage event will be recorded together with checking access. The\nrequired_balance field will be used as the usage value.").optional(),
  withPreview: z.boolean().describe("If true, the response will include a preview object, which can be used to\ndisplay information such as a paywall or upgrade confirmation.").optional(),
  dialog: z.any().optional().describe("Dialog configuration for feature check flow")
});

export interface CheckParams {
  /**
   * ID of the feature to check access to. Required if product_id is not provided.
   */
  featureId: string;

  /**
   * Properties used if customer is automatically created. Will also update if the
name or email is not already set.
   */
  customerData?: CustomerData;

  entityData?: EntityData;

  /**
   * If using entity balances (eg, seats), the entity ID to check access for.
   */
  entityId?: string;

  properties?: { [key: string]: unknown };

  /**
   * If you know the amount of the feature the end user is consuming in advance. If
their balance is below this quantity, allowed will be false.
   */
  requiredBalance?: number;

  /**
   * If true, a usage event will be recorded together with checking access. The
required_balance field will be used as the usage value.
   */
  sendEvent?: boolean;

  /**
   * If true, the response will include a preview object, which can be used to
display information such as a paywall or upgrade confirmation.
   */
  withPreview?: boolean;

  /**
   * Dialog configuration for feature check flow
   */
  dialog?: any;
}
