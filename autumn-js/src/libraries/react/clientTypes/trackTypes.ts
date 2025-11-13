// Auto-generated Zod schema
import { z } from "zod";
import { CustomerDataSchema } from "./customerDataTypes";
import { EntityDataSchema } from "./entityDataTypes";
import type { CustomerData } from "./customerDataTypes";
import type { EntityData } from "./entityDataTypes";

export const TrackParamsSchema = z.object({
  customerData: CustomerDataSchema.describe("Customer data to create or update the customer if they don't exist").optional(),
  entityData: EntityDataSchema.describe("Data for creating the entity if it doesn't exist").optional(),
  entityId: z.string().describe("The ID of the entity this event is associated with").optional(),
  eventName: z.string().describe("The name of the event to track").optional(),
  featureId: z.string().describe("The ID of the feature (alternative to event_name for usage events)").optional(),
  idempotencyKey: z.string().describe("Idempotency key to prevent duplicate events").optional(),
  overageBehavior: z.union([z.literal('cap'), z.literal('reject')]).describe("The behavior when the balance is insufficient").optional(),
  properties: z.record(z.string(), z.unknown()).describe("Additional properties for the event").optional(),
  setUsage: z.boolean().nullable().describe("Whether to set the usage to this value instead of increment").optional(),
  skipEvent: z.boolean().describe("Skip event insertion (for stress tests). Balance is still deducted, but event is\nnot persisted to database.").optional(),
  timestamp: z.number().describe("Unix timestamp in milliseconds when the event occurred").optional(),
  value: z.number().describe("The value/count of the event").optional()
});

export interface TrackParams {
  /**
   * Customer data to create or update the customer if they don't exist
   */
  customerData?: CustomerData;

  /**
   * Data for creating the entity if it doesn't exist
   */
  entityData?: EntityData;

  /**
   * The ID of the entity this event is associated with
   */
  entityId?: string;

  /**
   * The name of the event to track
   */
  eventName?: string;

  /**
   * The ID of the feature (alternative to event_name for usage events)
   */
  featureId?: string;

  /**
   * Idempotency key to prevent duplicate events
   */
  idempotencyKey?: string;

  /**
   * The behavior when the balance is insufficient
   */
  overageBehavior?: 'cap' | 'reject';

  /**
   * Additional properties for the event
   */
  properties?: { [key: string]: unknown };

  /**
   * Whether to set the usage to this value instead of increment
   */
  setUsage?: boolean | null;

  /**
   * Skip event insertion (for stress tests). Balance is still deducted, but event is
not persisted to database.
   */
  skipEvent?: boolean;

  /**
   * Unix timestamp in milliseconds when the event occurred
   */
  timestamp?: number;

  /**
   * The value/count of the event
   */
  value?: number;
}
