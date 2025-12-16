import { z } from "zod/v4";

export const PaginationDefaults = {
	Limit: 100,
	MaxLimit: 1000,
};

export const CursorPaginationQuerySchema = z.object({
	starting_after: z
		.string()
		.optional()
		.describe("Cursor for pagination. Use next_cursor from previous response."),
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(PaginationDefaults.MaxLimit)
		.optional()
		.describe(
			`Number of items to return. Default ${PaginationDefaults.Limit}, max ${PaginationDefaults.MaxLimit}.`,
		),
});

// Event List Types
export const EventListParamsSchema = CursorPaginationQuerySchema.extend({
	customer_id: z.string().describe("Filter events by customer ID"),
	feature_id: z
		.string()
		.min(1)
		.or(z.array(z.string().min(1)))
		.describe("Filter by specific feature ID(s)"),
	time_range: z
		.object({
			start: z.coerce
				.number()
				.optional()
				.describe("Filter events after this timestamp (epoch milliseconds)"),
			end: z.coerce
				.number()
				.optional()
				.describe("Filter events before this timestamp (epoch milliseconds)"),
		})
		.optional()
		.describe("Filter events by time range"),
});

export type EventListParams = z.infer<typeof EventListParamsSchema>;

export const EventListItemSchema = z.object({
	id: z.string().describe("Event ID (KSUID)"),
	timestamp: z.number().describe("Event timestamp (epoch milliseconds)"),
	event_name: z.string().describe("Name of the event"),
	customer_id: z.string().describe("Customer identifier"),
	value: z.number().describe("Event value/count"),
	properties: z.object({}).describe("Event properties (JSONB)"),
});

export type EventListItem = z.infer<typeof EventListItemSchema>;

export const EventListResponseSchema = z.object({
	list: z.array(EventListItemSchema).describe("Array of events for current page"),
	has_more: z.boolean().describe("Whether more results exist after this page"),
	next_cursor: z
		.string()
		.nullable()
		.describe("Opaque cursor for next page. Null if no more results."),
});

export type EventListResponse = z.infer<typeof EventListResponseSchema>;

// Event Aggregation Types
export const RangeEnumSchema = z.enum([
	"24h",
	"7d",
	"30d",
	"90d",
	"last_cycle",
	"1bc",
	"3bc",
]);

export type RangeEnum = z.infer<typeof RangeEnumSchema>;

export const BinSizeEnumSchema = z.enum(["day", "hour"]).default("day");

export type BinSizeEnum = z.infer<typeof BinSizeEnumSchema>;

export const EventAggregationParamsSchema = z.object({
	customer_id: z.string().min(1).describe("Customer ID to aggregate events for"),
	feature_id: z
		.string()
		.min(1)
		.or(z.array(z.string().min(1)))
		.describe("Feature ID(s) to aggregate"),
	group_by: z
		.string()
		.startsWith("properties.")
		.optional()
		.describe("Group results by a property field (e.g., 'properties.region')"),
	range: RangeEnumSchema.optional().describe(
		"Predefined time range. One of: 24h, 7d, 30d, 90d, last_cycle, 1bc, 3bc",
	),
	bin_size: BinSizeEnumSchema.describe("Bin size for aggregation: 'day' or 'hour'"),
	custom_range: z
		.object({
			start: z.number().describe("Start timestamp (epoch milliseconds)"),
			end: z.number().describe("End timestamp (epoch milliseconds)"),
		})
		.optional()
		.describe("Custom time range (mutually exclusive with range)"),
});

export type EventAggregationParams = z.infer<typeof EventAggregationParamsSchema>;

export type FlatAggregatedRow = {
	period: number;
	[featureName: string]: number;
};

export type GroupedAggregatedRow = {
	period: number;
} & {
	[featureName: string]: Record<string, number>;
};

export type AggregatedEventRow = FlatAggregatedRow | GroupedAggregatedRow;

export const EventAggregationTotalSchema = z.record(
	z.string(),
	z.object({
		count: z.number(),
		sum: z.number(),
	}),
);

export type EventAggregationTotal = z.infer<typeof EventAggregationTotalSchema>;

export type EventAggregationResponse = {
	list: AggregatedEventRow[];
	total: EventAggregationTotal;
};