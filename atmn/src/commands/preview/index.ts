import chalk from "chalk";
import { loadConfig } from "./loadConfig.js";

export const previewCommand = async ({
	planId,
	currency = "USD",
	cwd = process.cwd(),
}: {
	planId?: string;
	currency?: string;
	cwd?: string;
}): Promise<void> => {
	let config: Awaited<ReturnType<typeof loadConfig>>;
	try {
		config = await loadConfig({ cwd });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(chalk.red(`Error: ${message}`));
		process.exit(1);
	}

	const { plans } = config;

	if (!plans || plans.length === 0) {
		console.error(chalk.red("No plans found in autumn.config.ts"));
		process.exit(1);
	}

	let plansToPreview = plans;
	if (planId) {
		plansToPreview = plans.filter((p) => p.id === planId);
		if (plansToPreview.length === 0) {
			console.error(chalk.red(`Plan not found: ${planId}`));
			console.error(
				chalk.gray(`Available plans: ${plans.map((p) => p.id).join(", ")}`),
			);
			process.exit(1);
		}
	}

	const { createPreviewApp } = await import(
		"../../views/rezi/preview/PreviewApp.js"
	);
	await createPreviewApp({ planId, currency, cwd });
};
