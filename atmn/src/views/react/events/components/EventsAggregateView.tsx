import { Box, Text, useStdout } from "ink";
import type { FormattedTimeBucket } from "../../../../lib/hooks/useEventsAggregateApi.js";
import type { AggregateBinSize } from "../../../../lib/api/endpoints/events.js";

/**
 * Calculate chart dimensions based on terminal size
 */
function useChartDimensions() {
	const { stdout } = useStdout();
	const terminalWidth = stdout?.columns ?? 80;
	const terminalHeight = stdout?.rows ?? 24;

	// Reserve space for: title bar (2), summary stats (1), chart title (1), 
	// x-axis labels (2), "By Feature" section header (1), feature rows (up to 8), 
	// keyboard hints (2), margins (2)
	const reservedHeight = 19;
	const availableHeight = Math.max(6, terminalHeight - reservedHeight);
	
	// Chart height: use most of available space, cap at 16 for readability
	const maxBarHeight = Math.min(16, availableHeight);
	
	// Chart width: reserve space for y-axis label (6 chars) and some margin
	// Each bucket is 1 char wide
	const reservedWidth = 10;
	const maxBuckets = Math.max(10, Math.min(60, terminalWidth - reservedWidth));

	return { maxBarHeight, maxBuckets };
}

export interface EventsAggregateViewProps {
	/** Formatted time bucket data from API */
	data: FormattedTimeBucket[] | undefined;
	/** Totals per feature */
	totals: Record<string, { count: number; sum: number }> | undefined;
	/** Whether data is loading */
	isLoading: boolean;
	/** Whether there's an error */
	isError: boolean;
	/** Error message */
	error: Error | null;
	/** Whether customer ID is required but not provided */
	requiresCustomer: boolean;
	/** Whether features are needed but not available */
	needsFeatures: boolean;
	/** Current bin size for display */
	binSize: AggregateBinSize;
	/** Whether this view is focused */
	isFocused: boolean;
}

/**
 * Colors for different features in charts
 */
const FEATURE_COLORS = ["cyan", "green", "yellow", "magenta", "blue"] as const;

/**
 * Get color for a feature index
 */
function getFeatureColor(index: number): string {
	return FEATURE_COLORS[index % FEATURE_COLORS.length];
}

/**
 * ASCII time-series bar chart component
 */
function TimeSeriesChart({
	data,
	maxBarHeight = 8,
	maxBuckets = 20,
}: {
	data: FormattedTimeBucket[];
	maxBarHeight?: number;
	maxBuckets?: number;
}) {
	try {
		if (!data || data.length === 0) {
			return <Text color="gray">No time data available</Text>;
		}

		const buckets = data.slice(-maxBuckets);
		if (buckets.length === 0) {
			return <Text color="gray">No buckets to display</Text>;
		}

		const maxValue = Math.max(...buckets.map((b) => b.totalValue), 1);

		const rows: string[] = [];
		for (let row = maxBarHeight - 1; row >= 0; row--) {
			const threshold = (row / maxBarHeight) * maxValue;
			let rowStr = "";
			for (const bucket of buckets) {
				rowStr += bucket.totalValue > threshold ? "█" : " ";
			}
			rows.push(rowStr);
		}

		return (
			<Box flexDirection="column">
				<Box>
					<Text color="gray">{maxValue.toString().padStart(5)} </Text>
					<Text color="gray">{"─".repeat(buckets.length)}</Text>
				</Box>
				{rows.map((row, rowIndex) => (
					<Box key={`row-${maxBarHeight - rowIndex}`}>
						<Text color="gray">{"     "} </Text>
						<Text color="cyan">{row}</Text>
					</Box>
				))}
				<Box>
					<Text color="gray">{"    0"} </Text>
					<Text color="gray">{"─".repeat(buckets.length)}</Text>
				</Box>
				{buckets.length > 0 && (
					<Box>
						<Text color="gray">{"      "}</Text>
						<Text color="gray">{buckets[0]?.label ?? ""}</Text>
						{buckets.length > 1 && (
							<Text color="gray">
								{"".padEnd(Math.max(0, buckets.length - (buckets[0]?.label?.length ?? 0) - (buckets[buckets.length - 1]?.label?.length ?? 0)))}
								{buckets[buckets.length - 1]?.label ?? ""}
							</Text>
						)}
					</Box>
				)}
			</Box>
		);
	} catch (err) {
		console.error("TimeSeriesChart error:", err);
		return <Text color="red">Chart error: {err instanceof Error ? err.message : String(err)}</Text>;
	}
}

/**
 * Summary stats display
 */
function SummaryStats({
	totals,
}: {
	totals: Record<string, { count: number; sum: number }>;
}) {
	try {
		const featureEntries = Object.entries(totals);
		const totalEvents = featureEntries.reduce((sum, [, t]) => sum + t.count, 0);
		const totalValue = featureEntries.reduce((sum, [, t]) => sum + t.sum, 0);

		return (
			<Box gap={3}>
				<Text>
					<Text color="cyan" bold>{totalEvents.toLocaleString()}</Text>
					<Text color="gray"> events</Text>
				</Text>
				<Text>
					<Text color="green" bold>{featureEntries.length}</Text>
					<Text color="gray"> features</Text>
				</Text>
				<Text>
					<Text color="magenta" bold>{totalValue.toLocaleString()}</Text>
					<Text color="gray"> total</Text>
				</Text>
			</Box>
		);
	} catch (err) {
		console.error("SummaryStats error:", err);
		return <Text color="red">Stats error</Text>;
	}
}

/**
 * Aggregate view with time-series chart
 */
export function EventsAggregateView({
	data,
	totals,
	isLoading,
	isError,
	error,
	requiresCustomer,
	needsFeatures,
	binSize,
}: EventsAggregateViewProps) {
	// Call hooks unconditionally at the top
	const { maxBarHeight, maxBuckets } = useChartDimensions();

	try {
		// Customer ID required
		if (requiresCustomer) {
			return (
				<Box flexDirection="column" paddingY={1}>
					<Text color="yellow" bold>Customer ID Required</Text>
					<Text color="gray">The aggregate view requires a customer ID to fetch data.</Text>
					<Text color="gray">Press <Text color="cyan">f</Text> to open filters and enter a customer ID.</Text>
				</Box>
			);
		}

		// No features available
		if (needsFeatures) {
			return (
				<Box flexDirection="column" paddingY={1}>
					<Text color="yellow" bold>No Features Available</Text>
					<Text color="gray">Create features or select features in the filter to see aggregate data.</Text>
					<Text color="gray">Press <Text color="cyan">f</Text> to open filters.</Text>
				</Box>
			);
		}

		// Loading state
		if (isLoading && !data) {
			return (
				<Box flexDirection="column">
					<Text color="yellow">Loading aggregate data...</Text>
				</Box>
			);
		}

		// Error state - THIS IS THE KEY PART
		if (isError && error) {
			return (
				<Box flexDirection="column" paddingY={1}>
					<Text color="red" bold>Error loading aggregate data</Text>
					<Text color="red">{error.message}</Text>
				</Box>
			);
		}

		// Empty state
		if (!data || data.length === 0 || !totals) {
			return (
				<Box flexDirection="column">
					<Text color="gray">No aggregate data available.</Text>
					<Text color="gray">Try adjusting the time range or selecting different features.</Text>
				</Box>
			);
		}

		const binLabel = binSize === "hour" ? "Hourly" : binSize === "month" ? "Monthly" : "Daily";

		return (
			<Box flexDirection="column">
				<SummaryStats totals={totals} />
				<Box marginTop={1} flexDirection="column">
					<Text bold color="gray">{binLabel} Events</Text>
					<TimeSeriesChart data={data} maxBarHeight={maxBarHeight} maxBuckets={maxBuckets} />
				</Box>
				<Box marginTop={1} flexDirection="column">
					<Text bold color="gray">By Feature</Text>
					{Object.entries(totals).slice(0, 8).map(([featureId, stats], idx) => (
						<Box key={featureId} gap={1}>
							<Text color={getFeatureColor(idx)}>{"█"}</Text>
							<Text color="white">
								{featureId.length > 20 ? `${featureId.slice(0, 18)}..` : featureId.padEnd(20)}
							</Text>
							<Text color="gray">
								{stats.count.toLocaleString()} events, {stats.sum.toLocaleString()} total
							</Text>
						</Box>
					))}
				</Box>
			</Box>
		);
	} catch (err) {
		console.error("EventsAggregateView error:", err);
		return (
			<Box flexDirection="column" paddingY={1}>
				<Text color="red" bold>Error rendering aggregate view</Text>
				<Text color="red">{err instanceof Error ? err.message : String(err)}</Text>
			</Box>
		);
	}
}
