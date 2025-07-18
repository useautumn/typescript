import {z} from 'zod';
import {ProductItemSchema} from './productItemModels.js';

export const ProductSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	is_add_on: z.boolean().default(false).optional(),
	is_default: z.boolean().default(false).optional(),
	items: z.array(ProductItemSchema),
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
});

export type Feature = z.infer<typeof FeatureSchema>;
export type Product = z.infer<typeof ProductSchema>;
