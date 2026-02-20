import { headlessFeaturesCommand } from "./headless.js";

export interface FeaturesCommandOptions {
	prod?: boolean;
	headless?: boolean;
	page?: number;
	search?: string;
	id?: string;
	limit?: number;
	format?: "text" | "json" | "csv";
	includeArchived?: boolean;
}

export async function featuresCommand(
	options: FeaturesCommandOptions = {},
): Promise<void> {
	if (options.headless || !process.stdout.isTTY) {
		await headlessFeaturesCommand({
			prod: options.prod,
			page: options.page,
			search: options.search,
			id: options.id,
			limit: options.limit,
			format: options.format,
			includeArchived: options.includeArchived,
		});
		return;
	}

	const { AppEnv } = await import("../../lib/env/index.js");
	const environment = options.prod ? AppEnv.Live : AppEnv.Sandbox;

	const { createFeaturesApp } = await import(
		"../../views/rezi/features/FeaturesApp.js"
	);
	await createFeaturesApp({
		environment,
		onExit: () => process.exit(0),
	});
}

export default featuresCommand;
