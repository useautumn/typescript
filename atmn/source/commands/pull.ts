// @ts-nocheck
import chalk from "chalk";
import prettier from "prettier";
import type { Feature } from "../compose/models/featureModels.js";
import type { Plan } from "../compose/models/planModels.js";
import { featureBuilder } from "../core/builders/featureBuilder.js";
import {
	importBuilder,
	planBuilder
} from "../core/builders/planBuilder.js";
import { writeConfig } from "../core/config.js";
import { generateSDKTypes } from "../core/generateSDKTypes.js";
import { getAllPlans, getFeatures } from "../core/pull.js";

export default async function Pull(options?: { archived?: boolean }) {
	console.log(chalk.green("Pulling plans and features from Autumn..."));
	const plans = await getAllPlans({ archived: options?.archived ?? false });
	const features = await getFeatures({ includeArchived: true });

	const planSnippets = plans.map((plan: Plan) =>
		planBuilder({ plan, features }),
	);

	const featureSnippets = features
		.filter((feature: Feature) => !feature.archived)
		.map((feature: Feature) => featureBuilder(feature));

	const autumnConfig = `
${importBuilder()}

// Features${featureSnippets.join("\n")}

// Plans${planSnippets.join("\n")}
	`;

	const formattedConfig = await prettier.format(autumnConfig, {
		parser: "typescript",
		useTabs: true,
		singleQuote: false,
	});

	writeConfig(formattedConfig);

	// Fetch products and features from both sandbox and production for comprehensive SDK types
	console.log(
		chalk.dim(
			"Fetching products and features from all environments for SDK types...",
		),
	);
	const allEnvironmentFeatures = await fetchFeaturesFromAllEnvironments();
	const allEnvironmentPlans = await fetchPlansFromAllEnvironments();

	// Generate SDK type narrowing for autocomplete
	const sdkTypesPath = generateSDKTypes({
		plans: allEnvironmentPlans, // Use combined plans from both environments
		features: allEnvironmentFeatures, // Use combined features from both environments
		outputDir: process.cwd(),
	});

	console.log(chalk.green("Success! Config has been updated."));
	console.log(chalk.dim(`Generated SDK types at: ${sdkTypesPath}`));
}

/**
 * Fetch features from both sandbox and production environments
 * This ensures SDK autocomplete includes all possible feature IDs
 */
async function fetchFeaturesFromAllEnvironments(): Promise<Feature[]> {
	const { readFromEnv, isProdFlag } = await import("../core/utils.js");
	const { getFeatures } = await import("../core/pull.js");

	const currentEnvIsProd = isProdFlag();
	const allFeatures: Feature[] = [];
	const seenIds = new Set<string>();

	try {
		// Fetch from current environment
		const currentFeatures = await getFeatures({ includeArchived: true });
		currentFeatures.forEach((f: Feature) => {
			if (!seenIds.has(f.id)) {
				allFeatures.push(f);
				seenIds.add(f.id);
			}
		});

		// Try to fetch from other environment if keys exist
		const { readFromEnv: readEnvDirect } = await import("fs");
		const envPath = `${process.cwd()}/.env`;
		const fs = await import("fs");

		if (fs.existsSync(envPath)) {
			const envContent = fs.readFileSync(envPath, "utf-8");
			const otherKeyName = currentEnvIsProd
				? "AUTUMN_SECRET_KEY"
				: "AUTUMN_PROD_SECRET_KEY";
			const otherKeyMatch = envContent.match(
				new RegExp(`${otherKeyName}=(.+)`),
			);

			if (otherKeyMatch && otherKeyMatch[1]) {
				// Temporarily switch environment
				const originalArgs = [...process.argv];
				if (currentEnvIsProd) {
					process.argv = process.argv.filter(
						(a) => a !== "--prod" && a !== "-p",
					);
				} else {
					process.argv.push("--prod");
				}

				try {
					const otherFeatures = await getFeatures({ includeArchived: true });
					otherFeatures.forEach((f: Feature) => {
						if (!seenIds.has(f.id)) {
							allFeatures.push(f);
							seenIds.add(f.id);
						}
					});
				} catch (error) {
					// Silently fail if other environment is not accessible
					console.log(
						chalk.dim("Could not fetch from other environment (this is okay)"),
					);
				}

				// Restore original args
				process.argv = originalArgs;
			}
		}
	} catch (error) {
		// Fall back to current environment only
		console.log(chalk.dim("Using features from current environment only"));
	}

	return allFeatures;
}

/**
 * Fetch plans from both sandbox and production environments
 * This ensures SDK autocomplete includes all possible product IDs
 */
async function fetchPlansFromAllEnvironments(): Promise<Plan[]> {
	const { isProdFlag } = await import("../core/utils.js");
	const { getAllPlans } = await import("../core/pull.js");

	const currentEnvIsProd = isProdFlag();
	const allPlans: Plan[] = [];
	const seenIds = new Set<string>();

	try {
		// Fetch from current environment
		const currentPlans = await getAllPlans({ archived: true });
		currentPlans.forEach((plan: Plan) => {
			if (!seenIds.has(plan.id)) {
				allPlans.push(plan);
				seenIds.add(plan.id);
			}
		});

		// Try to fetch from other environment if keys exist
		const envPath = `${process.cwd()}/.env`;
		const fs = await import("fs");

		if (fs.existsSync(envPath)) {
			const envContent = fs.readFileSync(envPath, "utf-8");
			const otherKeyName = currentEnvIsProd
				? "AUTUMN_SECRET_KEY"
				: "AUTUMN_PROD_SECRET_KEY";
			const otherKeyMatch = envContent.match(
				new RegExp(`${otherKeyName}=(.+)`),
			);

			if (otherKeyMatch && otherKeyMatch[1]) {
				// Temporarily switch environment
				const originalArgs = [...process.argv];
				if (currentEnvIsProd) {
					process.argv = process.argv.filter(
						(a) => a !== "--prod" && a !== "-p",
					);
				} else {
					process.argv.push("--prod");
				}

				try {
					const otherPlans = await getAllPlans({ archived: true });
					otherPlans.forEach((plan: Plan) => {
						if (!seenIds.has(plan.id)) {
							allPlans.push(plan);
							seenIds.add(plan.id);
						}
					});
				} catch (error) {
					// Silently fail if other environment is not accessible
					console.log(
						chalk.dim(
							"Could not fetch products from other environment (this is okay)",
						),
					);
				}

				// Restore original args
				process.argv = originalArgs;
			}
		}
	} catch (error) {
		// Fall back to current environment only
		console.log(chalk.dim("Using products from current environment only"));
	}

	return allPlans;
}
