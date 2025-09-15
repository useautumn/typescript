import {z} from 'zod/v4';

export const ProductItemIntervalEnum = z.enum(
	['minute', 'hour', 'day', 'week', 'month', 'quarter', 'semi_annual', 'year'],
	{
		message:
			"Interval must be 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'semi_annual', or 'year'",
	},
);

export const UsageModelEnum = z.enum(['prepaid', 'pay_per_use'], {
	message: "Usage model must be 'prepaid' or 'pay_per_use'",
});

export type ProductItemInterval = z.infer<typeof ProductItemIntervalEnum>;
export type UsageModel = z.infer<typeof UsageModelEnum>;

export const ProductItemSchema = z.object({
	type: z
		.enum(['feature', 'priced_feature'], {
			message: "Type must be 'feature' or 'priced_feature'",
		})
		.nullish(),
	feature_id: z
		.string({
			message: 'Feature ID must be a string',
		})
		.nullish(),
	included_usage: z
		.union([z.number(), z.literal('inf')], {
			message: 'Included usage must be a number or "inf"',
		})
		.nullish(),
	interval: ProductItemIntervalEnum.nullish(),
	usage_model: UsageModelEnum.nullish(),
	price: z
		.number({
			message: 'Price must be a valid number',
		})
		.nullish(),
	tiers: z
		.array(
			z.object({
				amount: z.number({
					message: 'Tier amount must be a valid number',
				}),
				to: z.union([z.number(), z.literal('inf')], {
					message: 'Tier "to" must be a number or "inf"',
				}),
			}),
		)
		.nullish(),
	billing_units: z
		.number({
			message: 'Billing units must be a valid number',
		})
		.nullish(),

	reset_usage_when_enabled: z
		.boolean({
			message: 'Reset usage when enabled must be true or false',
		})
		.optional(),
	entity_feature_id: z
		.string({
			message: 'Entity feature ID must be a string',
		})
		.optional(),
});

export const FeatureItemSchema = z.object({
	feature_id: z.string({
		message: 'Feature ID is required and must be a string',
	}),
	included_usage: z
		.number({
			message: 'Included usage must be a valid number',
		})
		.nullish(),
	interval: ProductItemIntervalEnum.nullish(),
});

export const PriceItemSchema = z.object({
	price: z
		.number({
			message: 'Price must be a valid number',
		})
		.gt(0, 'Price must be greater than 0'),
	interval: ProductItemIntervalEnum.nullish(),
});

export type FeatureItem = z.infer<typeof FeatureItemSchema>;
export type PriceItem = z.infer<typeof PriceItemSchema>;
export type ProductItem = z.infer<typeof ProductItemSchema>;
