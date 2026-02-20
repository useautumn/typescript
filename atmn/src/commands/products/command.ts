import { headlessProductsCommand } from "./headless.js";

export interface ProductsCommandOptions {
	prod?: boolean;
	headless?: boolean;
	page?: number;
	search?: string;
	id?: string;
	limit?: number;
	format?: "text" | "json" | "csv";
	includeArchived?: boolean;
}

export async function productsCommand(
	options: ProductsCommandOptions = {},
): Promise<void> {
	if (options.headless || !process.stdout.isTTY) {
		await headlessProductsCommand({
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

	const { createProductsApp } = await import(
		"../../views/rezi/products/ProductsApp.js"
	);
	await createProductsApp({
		environment,
		onExit: () => process.exit(0),
	});
}

export default productsCommand;
