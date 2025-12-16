import { z } from "zod/v4";

export const PaginationDefaults = {
	Limit: 100,
	MaxLimit: 1000,
};

export const CursorPaginationQuerySchema = z.object({
	starting_after: z.string().optional(),
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(PaginationDefaults.MaxLimit)
		.default(PaginationDefaults.Limit)
		.optional(),
});

export type CursorPaginationQuery = z.infer<typeof CursorPaginationQuerySchema>;

export const createCursorPaginatedResponseSchema = <T extends z.ZodType>(
	itemSchema: T,
) =>
	z.object({
		list: z.array(itemSchema),
		has_more: z.boolean(),
		next_cursor: z.string().nullable(),
	});

export type CursorPaginatedResponse<T> = {
	data: T[];
	has_more: boolean;
	next_cursor: string | null;
};
