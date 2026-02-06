import chalk from "chalk";
import { loadConfig } from "./loadConfig.js";
import { formatPlanPreviewAsText, getPlanPreview } from "./previewPlan.js";

export const previewCommand = async ({
	planId,
	currency = "USD",
	cwd = process.cwd(),
}: {
	planId?: string; // Optional: preview specific plan, or all if not specified
	currency?: string;
	cwd?: string;
}): Promise<void> => {
	// 1. Load autumn.config.ts from cwd
	let config: Awaited<ReturnType<typeof loadConfig>>;
	try {
		config = await loadConfig({ cwd });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(chalk.red(`Error: ${message}`));
		process.exit(1);
	}

	const { plans, features } = config;

	// Validate we have plans
	if (!plans || plans.length === 0) {
		console.error(chalk.red("No plans found in autumn.config.ts"));
		process.exit(1);
	}

	// 2. If planId specified, filter to just that plan
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

	// 3. For each plan, generate preview and print
	// 4. Separate multiple plans with blank line
	for (let i = 0; i < plansToPreview.length; i++) {
		const plan = plansToPreview[i];

		const preview = getPlanPreview({
			plan,
			features,
			currency,
		});

		const text = formatPlanPreviewAsText({ preview });
		console.log(text);

		// Add blank line between plans (but not after the last one)
		if (i < plansToPreview.length - 1) {
			console.log();
		}
	}
};
