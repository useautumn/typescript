// Auto-generated Zod schema
import { z } from "zod";
import type { CustomerData } from "./customerDataTypes";
import { CustomerDataSchema } from "./customerDataTypes";
import type { EntityData } from "./entityDataTypes";
import { EntityDataSchema } from "./entityDataTypes";

export const CheckParamsSchema = z.object({
	customerData: CustomerDataSchema.describe(
		"Used to add customer details like name or email when auto-creating a customer.",
	).optional(),
	entityData: EntityDataSchema.optional(),
	entityId: z.string().optional(),
	featureId: z.string().optional(),
	productId: z.string().optional(),
	properties: z.record(z.string(), z.unknown()).optional(),
	requiredBalance: z.number().optional(),
	requiredQuantity: z.number().optional(),
	sendEvent: z.boolean().optional(),
	withPreview: z.boolean().optional(),
	dialog: z
		.any()
		.optional()
		.describe("Dialog configuration for feature check flow"),
});

export interface CheckParams {
	/**
	 * Used to add customer details like name or email when auto-creating a customer.
	 */
	customerData?: CustomerData;

	entityData?: EntityData;

	entityId?: string;

	featureId?: string;

	productId?: string;

	properties?: { [key: string]: unknown };

	requiredBalance?: number;

	requiredQuantity?: number;

	sendEvent?: boolean;

	withPreview?: boolean;

	/**
	 * Dialog configuration for feature check flow
	 */
	dialog?: any;
}
