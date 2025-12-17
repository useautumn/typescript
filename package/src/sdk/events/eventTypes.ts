import {
	CursorPaginationQuerySchema,
	createCursorPaginatedResponseSchema,
} from "@sdk/general/cursorTypes";
import { z } from "zod/v4";

export const QueryRangeEnum = z.enum([
	"24h",
	"7d",
	"30d",
	"90d",
	"last_cycle",
	"1bc",
	"3bc",
]);

export const BinSizeEnum = z.enum(["day", "hour"]);

export const QueryParamsSchema = z.object({
	customer_id: z.string(),
	feature_id: z.string().or(z.array(z.string())),
	range: QueryRangeEnum.optional(),
	group_by: z.string().startsWith("properties.").optional(),
	bin_size: BinSizeEnum.optional(),
	custom_range: z
		.object({
			start: z.number(),
			end: z.number(),
		})
		.optional(),
});

export type QueryParams = z.infer<typeof QueryParamsSchema>;

export type QueryResult = {
	list: Array<
		{
			period: number;
		} & {
			[key: string]: number | Record<string, number>;
		}
	>;
};

export const LogParamsSchema = CursorPaginationQuerySchema.extend({
	customer_id: z.string(),
	feature_id: z.string().or(z.array(z.string())),
	time_range: z
		.object({
			start: z.coerce.number().optional(),
			end: z.coerce.number().optional(),
		})
		.optional(),
});

export type LogParams = z.infer<typeof LogParamsSchema>;

export const EventListItemSchema = z.object({
	id: z.string().describe("Event ID (KSUID)"),
	timestamp: z.number().describe("Event timestamp (epoch milliseconds)"),
	feature_id: z.string().describe("Name of the event"),
	customer_id: z.string().describe("Customer identifier"),
	value: z.number().describe("Event value/count"),
	properties: z.object({}).describe("Event properties (JSONB)"),
});

export type EventListItem = z.infer<typeof EventListItemSchema>;

export const EventListResponseSchema =
	createCursorPaginatedResponseSchema(EventListItemSchema);

export type EventListResponse = z.infer<typeof EventListResponseSchema>;
