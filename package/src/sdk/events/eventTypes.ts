import { z } from "zod/v4";
import {
	createPagePaginatedResponseSchema,
	PagePaginationQuerySchema,
} from "../general/pageTypes";

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

// EVENT LIST PARAMS

export const EventsListParamsSchema = PagePaginationQuerySchema.extend({
	customer_id: z.string(),
	feature_id: z.string().or(z.array(z.string())),
	custom_range: z
		.object({
			start: z.coerce.number().optional(),
			end: z.coerce.number().optional(),
		})
		.optional(),
});

export type EventsListParams = z.infer<typeof EventsListParamsSchema>;

export const EventsListItemSchema = z.object({
	id: z.string().describe("Event ID (KSUID)"),
	timestamp: z.number().describe("Event timestamp (epoch milliseconds)"),
	feature_id: z.string().describe("Name of the event"),
	customer_id: z.string().describe("Customer identifier"),
	value: z.number().describe("Event value/count"),
	properties: z.object({}).describe("Event properties (JSONB)"),
});

export type EventsListItem = z.infer<typeof EventsListItemSchema>;

export const EventsListResponseSchema =
	createPagePaginatedResponseSchema(EventsListItemSchema);

export type EventsListResponse = z.infer<typeof EventsListResponseSchema>;
