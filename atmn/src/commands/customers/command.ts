import { AppEnv } from "../../lib/env/detect.js";
import { headlessCustomersCommand } from "./headless.js";

export interface CustomersCommandOptions {
	prod?: boolean;
	/** Run in headless mode (output for AI/programmatic use) */
	headless?: boolean;
	/** Page number */
	page?: number;
	/** Search query */
	search?: string;
	/** Get specific customer by ID */
	id?: string;
	/** Items per page */
	limit?: number;
	/** Output format: text, json, csv */
	format?: "text" | "json" | "csv";
}

/**
 * Customers command entry point
 * Renders the interactive customers view or runs in headless mode
 */
export async function customersCommand(
	options: CustomersCommandOptions = {},
): Promise<void> {
	// Headless mode - structured output for AI/programmatic use
	// Auto-enable if not in a TTY
	if (options.headless || !process.stdout.isTTY) {
		await headlessCustomersCommand({
			prod: options.prod,
			page: options.page,
			search: options.search,
			id: options.id,
			limit: options.limit,
			format: options.format,
		});
		return;
	}

	const environment = options.prod ? AppEnv.Live : AppEnv.Sandbox;

	// Interactive mode - render Rezi TUI
	const { createCustomersApp } = await import(
		"../../views/rezi/customers/CustomersApp.js"
	);
	await createCustomersApp({
		environment,
		onExit: () => process.exit(0),
	});
}

export default customersCommand;
