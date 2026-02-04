/**
 * Headless mode for the events command.
 * Provides structured output (text/json/csv) for AI/programmatic interaction.
 * Events uses SERVER-SIDE pagination (offset/limit) unlike products/features.
 */

import { AppEnv } from "../../lib/env/detect.js";
import { getKey } from "../../lib/env/keys.js";
import {
	fetchEvents,
	type ApiEventsListItem,
	type ApiEventsListResponse,
} from "../../lib/api/endpoints/events.js";
import { formatError } from "../../lib/api/client.js";

export interface HeadlessEventsOptions {
	/** Environment (sandbox/live) */
	prod?: boolean;
	/** Page number (1-indexed, converted to offset internally) */
	page?: number;
	/** Items per page */
	limit?: number;
	/** Output format */
	format?: "text" | "json" | "csv";
	/** Filter by customer ID */
	customerId?: string;
	/** Filter by feature ID */
	featureId?: string;
}

/**
 * Execute a headless events command
 */
export async function headlessEventsCommand(
	options: HeadlessEventsOptions,
): Promise<void> {
	const environment = options.prod ? AppEnv.Live : AppEnv.Sandbox;
	const format = options.format ?? "text";
	const page = options.page ?? 1;
	const limit = options.limit ?? 100;

	try {
		const secretKey = getKey(environment);

		// Convert page to offset for server-side pagination
		const offset = (page - 1) * limit;

		// Fetch events with server-side pagination
		const response = await fetchEvents({
			secretKey,
			customerId: options.customerId,
			featureId: options.featureId,
			offset,
			limit,
		});

		// Output the list
		outputEventList(
			response.list,
			{
				page,
				pageSize: limit,
				total: response.total,
				hasMore: response.has_more,
			},
			format,
			options.customerId,
			options.featureId,
		);
	} catch (error) {
		const message = formatError(error);

		if (format === "json") {
			// For JSON, include structured error info
			const apiError = error as { status?: number; response?: unknown };
			console.log(
				JSON.stringify(
					{
						error: error instanceof Error ? error.message : String(error),
						status: apiError.status,
						details: apiError.response,
					},
					null,
					2,
				),
			);
		} else {
			console.error(`Error: ${message}`);
		}

		process.exit(1);
	}
}

/**
 * Output a list of events
 */
function outputEventList(
	events: ApiEventsListItem[],
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		hasMore: boolean;
	},
	format: "text" | "json" | "csv",
	customerId?: string,
	featureId?: string,
): void {
	if (format === "json") {
		console.log(
			JSON.stringify(
				{
					events,
					pagination: {
						page: pagination.page,
						pageSize: pagination.pageSize,
						total: pagination.total,
						hasMore: pagination.hasMore,
					},
					filters: {
						customerId: customerId ?? null,
						featureId: featureId ?? null,
					},
				},
				null,
				2,
			),
		);
		return;
	}

	if (format === "csv") {
		// CSV header
		console.log("id,timestamp,customer_id,feature_id,value");
		// CSV rows
		for (const e of events) {
			const timestamp = new Date(
				normalizeTimestamp(e.timestamp),
			).toISOString();
			console.log(
				`${e.id},${timestamp},${e.customer_id},${e.feature_id},${e.value}`,
			);
		}
		return;
	}

	// Text format
	const startItem = (pagination.page - 1) * pagination.pageSize + 1;
	const endItem = Math.min(
		startItem + events.length - 1,
		pagination.total,
	);
	console.log(
		`Events (Page ${pagination.page}, showing ${startItem}-${endItem} of ${pagination.total})`,
	);
	console.log("=".repeat(60));

	// Show active filters
	if (customerId || featureId) {
		const filters: string[] = [];
		if (customerId) filters.push(`customer: ${customerId}`);
		if (featureId) filters.push(`feature: ${featureId}`);
		console.log(`Filters: ${filters.join(", ")}`);
	}

	console.log("");

	if (events.length === 0) {
		console.log("No events found.");
		console.log("");
		console.log('Actions: --customer "cus_xxx", --feature "feature_id"');
		return;
	}

	// Calculate column widths - use truncated display for readability
	const idWidth = 16; // Truncate long IDs
	const timestampWidth = 18;
	const customerWidth = 16;
	const featureWidth = 14;
	const valueWidth = 8;

	// Header
	console.log(
		`${"ID".padEnd(idWidth)}  ${"Timestamp".padEnd(timestampWidth)}  ${"Customer".padEnd(customerWidth)}  ${"Feature".padEnd(featureWidth)}  ${"Value".padEnd(valueWidth)}`,
	);
	console.log(
		"-".repeat(idWidth + timestampWidth + customerWidth + featureWidth + valueWidth + 8),
	);

	// Rows
	for (const e of events) {
		const id = truncate(e.id, idWidth).padEnd(idWidth);
		const timestamp = formatDateTime(e.timestamp).padEnd(timestampWidth);
		const customer = truncate(e.customer_id, customerWidth).padEnd(customerWidth);
		const feature = truncate(e.feature_id, featureWidth).padEnd(featureWidth);
		const value = String(e.value).padEnd(valueWidth);
		console.log(`${id}  ${timestamp}  ${customer}  ${feature}  ${value}`);
	}

	console.log("");
	const actions: string[] = [];
	if (pagination.hasMore) {
		actions.push(`--page ${pagination.page + 1}`);
	}
	actions.push('--customer "cus_xxx"');
	actions.push('--feature "feature_id"');
	console.log(`Actions: ${actions.join(", ")}`);
}

/**
 * Normalize a timestamp to milliseconds.
 * Events use milliseconds, but handle both for safety.
 */
function normalizeTimestamp(timestamp: number): number {
	// If timestamp is less than ~10 billion, it's in seconds, convert to ms
	return timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp;
}

/**
 * Format a Unix timestamp as a readable date/time
 */
function formatDateTime(timestamp: number): string {
	const ms = normalizeTimestamp(timestamp);
	return new Date(ms).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Truncate a string to max length with ellipsis
 */
function truncate(str: string, maxLength: number): string {
	if (str.length <= maxLength) {
		return str;
	}
	return str.slice(0, maxLength - 3) + "...";
}
