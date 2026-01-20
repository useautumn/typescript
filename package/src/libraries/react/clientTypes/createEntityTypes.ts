// Auto-generated Zod schema
import { z } from "zod";
import { CustomerDataSchema } from "./customerDataTypes";
import type { CustomerData } from "./customerDataTypes";

export const EntityCreateParamsSchema = z.object({
  id: z.string().nullable().describe("The ID of the entity"),
  featureId: z.string().describe("The ID of the feature this entity is associated with"),
  customerData: CustomerDataSchema.describe("Customer details to set when creating a customer").optional(),
  name: z.string().nullable().describe("The name of the entity").optional()
});

export interface EntityCreateParams {
  /**
   * The ID of the entity
   */
  id: string | null;

  /**
   * The ID of the feature this entity is associated with
   */
  featureId: string;

  /**
   * Customer details to set when creating a customer
   */
  customerData?: CustomerData;

  /**
   * The name of the entity
   */
  name?: string | null;
}
