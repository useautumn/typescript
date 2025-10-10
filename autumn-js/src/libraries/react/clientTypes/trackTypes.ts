// Auto-generated Zod schema
import { z } from "zod";
import { CustomerDataSchema } from "./customerDataTypes";
import { EntityDataSchema } from "./entityDataTypes";
import type { CustomerData } from "./customerDataTypes";
import type { EntityData } from "./entityDataTypes";

export const TrackParamsCustomerDataSchema = z.object({
  email: z.string().nullable().optional(),
  fingerprint: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  name: z.string().nullable().optional(),
  stripeId: z.string().nullable().optional()
});

export const TrackParamsEntityDataSchema = z.object({
  featureId: z.string(),
  name: z.string().optional()
});

export const TrackParamsSchema = z.object({
  customerData: TrackParamsCustomerDataSchema.nullable().optional(),
  entityData: TrackParamsEntityDataSchema.nullable().optional(),
  entityId: z.string().nullable().optional(),
  eventName: z.string().optional(),
  featureId: z.string().optional(),
  idempotencyKey: z.string().nullable().optional(),
  properties: z.record(z.string(), z.unknown()).nullable().optional(),
  setUsage: z.boolean().nullable().optional(),
  timestamp: z.number().nullable().optional(),
  value: z.number().nullable().optional()
});

export interface TrackParamsCustomerData {
  email?: string | null;

  fingerprint?: string | null;

  metadata?: { [key: string]: unknown } | null;

  name?: string | null;

  stripeId?: string | null;
}

export interface TrackParamsEntityData {
  featureId: string;

  name?: string;
}

export interface TrackParams {
  customerData?: TrackParamsCustomerData | null;

  entityData?: TrackParamsEntityData | null;

  entityId?: string | null;

  eventName?: string;

  featureId?: string;

  idempotencyKey?: string | null;

  properties?: { [key: string]: unknown } | null;

  setUsage?: boolean | null;

  timestamp?: number | null;

  value?: number | null;
}
