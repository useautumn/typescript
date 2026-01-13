import { z } from "zod/v4";

export const ResetInterval = ["day", "week", "month", "year"] as const;

export const CreateBalanceParamsSchema = z.object({
	feature_id: z.string().describe("The feature ID to create the balance for"),
	customer_id: z.string().describe("The customer ID to assign the balance to"),
	entity_id: z
		.string()
		.optional()
		.describe("Entity ID for entity-scoped balances"),

	granted_balance: z
		.number()
		.optional()
		.describe("The initial balance amount to grant"),
	unlimited: z.boolean().optional().describe("Whether the balance is unlimited"),
	reset: z
		.object({
			interval: z.enum(ResetInterval),
			interval_count: z.number().optional(),
		})
		.optional()
		.describe("Reset configuration for the balance"),
	expires_at: z
		.number()
		.optional()
		.describe("Unix timestamp (milliseconds) when the balance expires"),
});

export type CreateBalanceParams = z.infer<typeof CreateBalanceParamsSchema>;

export type CreateBalanceResponse = {
	message: string;
};
