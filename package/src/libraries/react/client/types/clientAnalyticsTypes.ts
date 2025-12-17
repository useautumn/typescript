import { z } from "zod/v4";

export const PagePaginationDefaults = {
	Limit: 100,
	MaxLimit: 1000,
};

export const PagePaginationQuerySchema = z.object({
	offset: z.coerce
		.number()
		.int()
		.min(0)
		.default(0)
		.optional()
		.describe("Number of items to skip"),
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(PagePaginationDefaults.MaxLimit)
		.optional()
		.describe(
			`Number of items to return. Default ${PagePaginationDefaults.Limit}, max ${PagePaginationDefaults.MaxLimit}.`,
		),
});

// Event List Types
export const EventsListParamsSchema = PagePaginationQuerySchema.extend({
	featureId: z
		.string()
		.min(1)
		.or(z.array(z.string().min(1)))
		.describe("Filter by specific feature ID(s)"),
	customRange: z
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

export type EventsListParams = z.infer<typeof EventsListParamsSchema>;

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
	featureId: z
		.string()
		.min(1)
		.or(z.array(z.string().min(1)))
		.describe("Feature ID(s) to aggregate"),
	groupBy: z
		.string()
		.startsWith("properties.")
		.optional()
		.describe("Group results by a property field (e.g., 'properties.region')"),
	range: RangeEnumSchema.optional().describe(
		"Predefined time range. One of: 24h, 7d, 30d, 90d, last_cycle, 1bc, 3bc",
	),
	binSize: BinSizeEnumSchema.describe(
		"Bin size for aggregation: 'day' or 'hour'",
	),
	customRange: z
		.object({
			start: z.number().describe("Start timestamp (epoch milliseconds)"),
			end: z.number().describe("End timestamp (epoch milliseconds)"),
		})
		.optional()
		.describe("Custom time range (mutually exclusive with range)"),
});

export type EventAggregationParams = z.infer<
	typeof EventAggregationParamsSchema
>;

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

// export const EventListResponseSchema = z.object({
// 	list: z
// 		.array(EventListItemSchema)
// 		.describe("Array of events for current page"),
// 	has_more: z.boolean().describe("Whether more results exist after this page"),
// 	next_cursor: z
// 		.string()
// 		.nullable()
// 		.describe("Opaque cursor for next page. Null if no more results."),
// });

// export type EventListResponse = z.infer<typeof EventListResponseSchema>;
