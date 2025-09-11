import {z} from 'zod/v4';
import {ProductItemSchema} from './productItemModels.js';

export const FreeTrialSchema = z.object({
	duration: z.enum(['day', 'month', 'year']),
	length: z.number(),
	unique_fingerprint: z.boolean(),
	card_required: z.boolean(),
});

export const ProductSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	is_add_on: z.boolean().prefault(false).optional(),
	is_default: z.boolean().prefault(false).optional(),
	items: z.array(ProductItemSchema),
	free_trial: FreeTrialSchema.optional(),
});

export const FeatureSchema = z.object({
	id: z.string().min(1),
	name: z.string().optional(),
	type: z.enum(['boolean', 'single_use', 'continuous_use', 'credit_system']),
	credit_schema: z
		.array(
			z.object({
				metered_feature_id: z.string(),
				credit_cost: z.number(),
			}),
		)
		.optional(),
	archived: z.boolean().optional(),
});

export type Feature = z.infer<typeof FeatureSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type FreeTrial = z.infer<typeof FreeTrialSchema>;
