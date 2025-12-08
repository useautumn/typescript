import { z } from "zod/v4";
import { ProductItemSchema } from "./productItemModels.js";

export const FreeTrialSchema = z.object({
	duration: z.enum(["day", "month", "year"], {
		message: "Duration must be 'day', 'month', or 'year'",
	}),
	length: z.number({
		message: "Length must be a valid number",
	}),
	unique_fingerprint: z.boolean({
		message: "Unique fingerprint must be true or false",
	}),
	card_required: z.boolean({
		message: "Card required must be true or false",
	}),
});

export const ProductSchema = z.object({
	id: z.string().min(1, "Product ID is required and cannot be empty"),
	name: z.string().min(1, "Product name is required and cannot be empty"),
	group: z.string().optional(),
	is_add_on: z.boolean().prefault(false).optional(),
	is_default: z.boolean().prefault(false).optional(),
	items: z.array(ProductItemSchema, {
		message: "Items must be an array of product items",
	}),
	free_trial: FreeTrialSchema.optional(),
	archived: z.boolean().optional(),
});

export const FeatureSchema = z.object({
	id: z.string().min(1, "Feature ID is required and cannot be empty"),
	name: z.string().optional(),
	type: z.enum(["boolean", "single_use", "continuous_use", "credit_system"], {
		message:
			"Type must be 'boolean', 'single_use', 'continuous_use', or 'credit_system'",
	}),
	credit_schema: z
		.array(
			z.object({
				metered_feature_id: z.string({
					message: "Metered feature ID must be a string",
				}),
				credit_cost: z.number({
					message: "Credit cost must be a valid number",
				}),
			}),
		)
		.optional(),
	archived: z.boolean().optional(),
});

export type Feature = z.infer<typeof FeatureSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type FreeTrial = z.infer<typeof FreeTrialSchema>;
