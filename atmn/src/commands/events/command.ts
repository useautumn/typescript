import { headlessEventsCommand } from "./headless.js";

export interface EventsCommandOptions {
	prod?: boolean;
	headless?: boolean;
	page?: number;
	limit?: number;
	format?: "text" | "json" | "csv";
	customerId?: string;
	featureId?: string;
	timeRange?: "24h" | "7d" | "30d" | "90d";
	mode?: "list" | "aggregate";
	binSize?: "hour" | "day" | "month";
	groupBy?: string;
}

export async function eventsCommand(
	options: EventsCommandOptions = {},
): Promise<void> {
	const useHeadless = options.headless || !process.stdout.isTTY;

	if (useHeadless) {
		await headlessEventsCommand({
			prod: options.prod,
			page: options.page,
			limit: options.limit,
			format: options.format,
			customerId: options.customerId,
			featureId: options.featureId,
			timeRange: options.timeRange,
			mode: options.mode,
			binSize: options.binSize,
			groupBy: options.groupBy,
		});
		return;
	}

	const { AppEnv } = await import("../../lib/env/index.js");
	const environment = options.prod ? AppEnv.Live : AppEnv.Sandbox;

	const { createEventsApp } = await import(
		"../../views/rezi/events/EventsApp.js"
	);
	await createEventsApp({
		environment,
		onExit: () => process.exit(0),
		customerId: options.customerId,
		featureId: options.featureId,
	});
}

export default eventsCommand;
