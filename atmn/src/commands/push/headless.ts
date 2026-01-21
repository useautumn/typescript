import chalk from "chalk";
import fs from "node:fs";
import path, { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import createJiti from "jiti";
import type { Feature, Plan } from "../../../source/compose/models/index.js";
import { AppEnv } from "../../lib/env/index.js";
import { formatError } from "../../lib/api/client.js";
import {
	analyzePush,
	archiveFeature,
	archivePlan,
	deleteFeature,
	deletePlan,
	fetchRemoteData,
	pushFeature,
	pushPlan,
	unarchiveFeature,
	unarchivePlan,
} from "./push.js";
import type { PushAnalysis } from "./types.js";
import {
	createFeatureArchivedPrompt,
	createFeatureDeletePrompt,
	createPlanArchivedPrompt,
	createPlanDeletePrompt,
	createPlanVersioningPrompt,
	createProdConfirmationPrompt,
	type PushPrompt,
} from "./prompts.js";
import { validateConfig, formatValidationErrors } from "./validate.js";

interface LocalConfig {
	features: Feature[];
	plans: Plan[];
}

interface HeadlessPushOptions {
	cwd?: string;
	environment?: AppEnv;
	yes?: boolean;
}

interface HeadlessPushResult {
	success: boolean;
	featuresCreated: string[];
	featuresUpdated: string[];
	featuresDeleted: string[];
	featuresArchived: string[];
	plansCreated: string[];
	plansUpdated: string[];
	plansDeleted: string[];
	plansArchived: string[];
}

/**
 * Load local config file using jiti
 */
async function loadLocalConfig(cwd: string): Promise<LocalConfig> {
	const configPath = path.join(cwd, "autumn.config.ts");

	if (!fs.existsSync(configPath)) {
		throw new Error(
			`Config file not found at ${configPath}. Run 'atmn pull' first.`,
		);
	}

	const absolutePath = resolve(configPath);
	const fileUrl = pathToFileURL(absolutePath).href;

	const jiti = createJiti(import.meta.url);
	const mod = await jiti.import(fileUrl);

	const plans: Plan[] = [];
	const features: Feature[] = [];

	const modRecord = mod as { default?: unknown } & Record<string, unknown>;
	const defaultExport = modRecord.default as
		| {
				plans?: Plan[];
				features?: Feature[];
				products?: Plan[];
		  }
		| undefined;

	if (defaultExport?.plans && defaultExport?.features) {
		if (Array.isArray(defaultExport.plans)) {
			plans.push(...defaultExport.plans);
		}
		if (Array.isArray(defaultExport.features)) {
			features.push(...defaultExport.features);
		}
	} else if (defaultExport?.products && defaultExport?.features) {
		// Legacy format
		if (Array.isArray(defaultExport.products)) {
			plans.push(...defaultExport.products);
		}
		if (Array.isArray(defaultExport.features)) {
			features.push(...defaultExport.features);
		}
	} else {
		// New format: individual named exports
		for (const [key, value] of Object.entries(modRecord)) {
			if (key === "default") continue;

			const obj = value as { features?: unknown; type?: unknown };
			if (obj && typeof obj === "object") {
				if (Array.isArray(obj.features)) {
					plans.push(obj as unknown as Plan);
				} else if ("type" in obj) {
					features.push(obj as unknown as Feature);
				}
			}
		}
	}

	return { features, plans };
}

/**
 * Build the list of prompts that would be shown in interactive mode
 */
function buildPromptQueue(
	analysis: PushAnalysis,
	environment: AppEnv,
): PushPrompt[] {
	const prompts: PushPrompt[] = [];

	// Production confirmation
	if (environment === AppEnv.Live) {
		prompts.push(createProdConfirmationPrompt());
	}

	// Archived features
	for (const feature of analysis.archivedFeatures) {
		prompts.push(createFeatureArchivedPrompt(feature));
	}

	// Archived plans
	for (const plan of analysis.archivedPlans) {
		prompts.push(createPlanArchivedPrompt(plan));
	}

	// Plans that will version
	for (const planInfo of analysis.plansToUpdate) {
		if (planInfo.willVersion) {
			prompts.push(createPlanVersioningPrompt(planInfo));
		}
	}

	// Feature deletions
	for (const info of analysis.featuresToDelete) {
		prompts.push(createFeatureDeletePrompt(info));
	}

	// Plan deletions
	for (const info of analysis.plansToDelete) {
		prompts.push(createPlanDeletePrompt(info));
	}

	return prompts;
}

/**
 * Format a human-readable description of the issues that require confirmation
 */
function formatIssuesSummary(prompts: PushPrompt[]): string {
	const issues: string[] = [];

	for (const prompt of prompts) {
		switch (prompt.type) {
			case "prod_confirmation":
				issues.push("  - Pushing to production environment");
				break;
			case "plan_versioning":
				issues.push(
					`  - Plan "${prompt.entityId}" has customers and will create a new version`,
				);
				break;
			case "plan_delete_has_customers":
				issues.push(
					`  - Plan "${prompt.entityId}" needs to be removed but has customers`,
				);
				break;
			case "plan_delete_no_customers":
				issues.push(`  - Plan "${prompt.entityId}" will be deleted`);
				break;
			case "plan_archived":
				issues.push(`  - Plan "${prompt.entityId}" is archived and needs to be un-archived`);
				break;
			case "feature_delete_credit_system":
				issues.push(
					`  - Feature "${prompt.entityId}" is used by credit systems and cannot be deleted`,
				);
				break;
			case "feature_delete_products":
				issues.push(
					`  - Feature "${prompt.entityId}" is used by products and cannot be deleted`,
				);
				break;
			case "feature_delete_no_deps":
				issues.push(`  - Feature "${prompt.entityId}" will be deleted`);
				break;
			case "feature_archived":
				issues.push(
					`  - Feature "${prompt.entityId}" is archived and needs to be un-archived`,
				);
				break;
		}
	}

	return issues.join("\n");
}

/**
 * Execute the push with --yes flag (auto-confirm all prompts with defaults)
 */
async function executePushWithDefaults(
	config: LocalConfig,
	analysis: PushAnalysis,
	prompts: PushPrompt[],
): Promise<HeadlessPushResult> {
	const result: HeadlessPushResult = {
		success: true,
		featuresCreated: [],
		featuresUpdated: [],
		featuresDeleted: [],
		featuresArchived: [],
		plansCreated: [],
		plansUpdated: [],
		plansDeleted: [],
		plansArchived: [],
	};

	// Build response map from defaults
	const responses = new Map<string, string>();
	for (const prompt of prompts) {
		if (prompt.type === "prod_confirmation") {
			responses.set(prompt.id, "confirm");
			continue;
		}
		const defaultOption = prompt.options.find((o) => o.isDefault);
		responses.set(
			prompt.id,
			defaultOption?.value || prompt.options[0]?.value || "confirm",
		);
	}

	// Get remote plans for pushPlan
	const remoteData = await fetchRemoteData();
	const remotePlans = remoteData.plans;

	// Handle archived features - unarchive if default says so
	for (const feature of analysis.archivedFeatures) {
		const promptId = prompts.find(
			(p) => p.type === "feature_archived" && p.entityId === feature.id,
		)?.id;
		const response = promptId ? responses.get(promptId) : undefined;
		if (response === "unarchive") {
			console.log(chalk.dim(`  Un-archiving feature: ${feature.id}`));
			await unarchiveFeature(feature.id);
		}
	}

	// Push features
	const allFeatures = config.features;
	for (const feature of allFeatures) {
		const isArchived = analysis.archivedFeatures.some(
			(af) => af.id === feature.id,
		);
		if (isArchived) {
			const promptId = prompts.find(
				(p) => p.type === "feature_archived" && p.entityId === feature.id,
			)?.id;
			const response = promptId ? responses.get(promptId) : undefined;
			if (response === "skip") {
				continue;
			}
		}

		const pushResult = await pushFeature(feature);
		if (pushResult.action === "created") {
			result.featuresCreated.push(feature.id);
		} else {
			result.featuresUpdated.push(feature.id);
		}
	}

	// Handle archived plans - unarchive if default says so
	for (const plan of analysis.archivedPlans) {
		const promptId = prompts.find(
			(p) => p.type === "plan_archived" && p.entityId === plan.id,
		)?.id;
		const response = promptId ? responses.get(promptId) : undefined;
		if (response === "unarchive") {
			console.log(chalk.dim(`  Un-archiving plan: ${plan.id}`));
			await unarchivePlan(plan.id);
		}
	}

	// Push plans to create
	for (const plan of analysis.plansToCreate) {
		await pushPlan(plan, remotePlans);
		result.plansCreated.push(plan.id);
	}

	// Push plans to update
	for (const planInfo of analysis.plansToUpdate) {
		if (planInfo.willVersion) {
			const promptId = prompts.find(
				(p) => p.type === "plan_versioning" && p.entityId === planInfo.plan.id,
			)?.id;
			const response = promptId ? responses.get(promptId) : undefined;
			if (response === "skip") {
				continue;
			}
		}

		if (planInfo.isArchived) {
			const promptId = prompts.find(
				(p) => p.type === "plan_archived" && p.entityId === planInfo.plan.id,
			)?.id;
			const response = promptId ? responses.get(promptId) : undefined;
			if (response === "skip") {
				continue;
			}
		}

		await pushPlan(planInfo.plan, remotePlans);
		result.plansUpdated.push(planInfo.plan.id);
	}

	// Handle feature deletions
	for (const info of analysis.featuresToDelete) {
		const promptId = prompts.find(
			(p) => p.type.startsWith("feature_delete") && p.entityId === info.id,
		)?.id;
		const response = promptId ? responses.get(promptId) : undefined;

		if (response === "delete") {
			console.log(chalk.dim(`  Deleting feature: ${info.id}`));
			await deleteFeature(info.id);
			result.featuresDeleted.push(info.id);
		} else if (response === "archive") {
			console.log(chalk.dim(`  Archiving feature: ${info.id}`));
			await archiveFeature(info.id);
			result.featuresArchived.push(info.id);
		}
		// skip = do nothing
	}

	// Handle plan deletions
	for (const info of analysis.plansToDelete) {
		const promptId = prompts.find(
			(p) => p.type.startsWith("plan_delete") && p.entityId === info.id,
		)?.id;
		const response = promptId ? responses.get(promptId) : undefined;

		if (response === "delete") {
			console.log(chalk.dim(`  Deleting plan: ${info.id}`));
			await deletePlan(info.id);
			result.plansDeleted.push(info.id);
		} else if (response === "archive") {
			console.log(chalk.dim(`  Archiving plan: ${info.id}`));
			await archivePlan(info.id);
			result.plansArchived.push(info.id);
		}
		// skip = do nothing
	}

	return result;
}

/**
 * Execute a clean push (no edge cases, no prompts needed)
 */
async function executeCleanPush(
	config: LocalConfig,
	analysis: PushAnalysis,
): Promise<HeadlessPushResult> {
	const result: HeadlessPushResult = {
		success: true,
		featuresCreated: [],
		featuresUpdated: [],
		featuresDeleted: [],
		featuresArchived: [],
		plansCreated: [],
		plansUpdated: [],
		plansDeleted: [],
		plansArchived: [],
	};

	const remoteData = await fetchRemoteData();
	const remotePlans = remoteData.plans;

	// Push all features
	for (const feature of config.features) {
		const pushResult = await pushFeature(feature);
		if (pushResult.action === "created") {
			result.featuresCreated.push(feature.id);
		} else {
			result.featuresUpdated.push(feature.id);
		}
	}

	// Push plans to create
	for (const plan of analysis.plansToCreate) {
		await pushPlan(plan, remotePlans);
		result.plansCreated.push(plan.id);
	}

	// Push plans to update (no versioning issues since prompts.length === 0)
	for (const planInfo of analysis.plansToUpdate) {
		await pushPlan(planInfo.plan, remotePlans);
		result.plansUpdated.push(planInfo.plan.id);
	}

	return result;
}

/**
 * Headless push command - uses V2 logic without interactive prompts
 *
 * If any edge cases require user decisions and --yes is not set,
 * exits with a helpful message instructing the user to either:
 * - Run in an interactive terminal
 * - Use the --yes flag to auto-confirm with defaults
 */
export async function headlessPush(
	options: HeadlessPushOptions = {},
): Promise<HeadlessPushResult> {
	const cwd = options.cwd ?? process.cwd();
	const environment = options.environment ?? AppEnv.Sandbox;
	const yes = options.yes ?? false;

	const envLabel = environment === AppEnv.Live ? "production" : "sandbox";

	// Load config
	console.log(chalk.dim(`Loading autumn.config.ts...`));
	const config = await loadLocalConfig(cwd);
	console.log(
		chalk.dim(
			`  Found ${config.features.length} features, ${config.plans.length} plans`,
		),
	);

	// Validate config for missing required fields
	console.log(chalk.dim(`Validating config...`));
	const validation = validateConfig(config.features, config.plans);
	if (!validation.valid) {
		console.log(chalk.red("\nConfig validation failed:\n"));
		console.log(chalk.yellow(formatValidationErrors(validation.errors)));
		process.exit(1);
	}

	// Analyze changes
	console.log(chalk.dim(`Analyzing changes against ${envLabel}...`));
	const analysis = await analyzePush(config.features, config.plans);

	// Check if there are any changes that require action
	// Note: plansToUpdate and featuresToUpdate contain ALL items that exist both locally and remotely
	// We always push these (to ensure sync), but only show "has changes" for things that need 
	// user attention (creates, deletes, versioning, archives)
	const hasVersioningPlans = analysis.plansToUpdate.some((p) => p.willVersion);
	const hasChanges =
		analysis.featuresToCreate.length > 0 ||
		analysis.featuresToUpdate.length > 0 ||
		analysis.featuresToDelete.length > 0 ||
		analysis.plansToCreate.length > 0 ||
		analysis.plansToUpdate.length > 0 ||
		analysis.plansToDelete.length > 0 ||
		analysis.archivedFeatures.length > 0 ||
		analysis.archivedPlans.length > 0;

	if (!hasChanges) {
		console.log(chalk.green("\nAlready in sync - no changes to push."));
		return {
			success: true,
			featuresCreated: [],
			featuresUpdated: [],
			featuresDeleted: [],
			featuresArchived: [],
			plansCreated: [],
			plansUpdated: [],
			plansDeleted: [],
			plansArchived: [],
		};
	}

	// Build prompt queue to check for edge cases
	const prompts = buildPromptQueue(analysis, environment);

	// If there are prompts and --yes is not set, exit with helpful message
	if (prompts.length > 0 && !yes) {
		console.log(chalk.yellow("\nPush requires confirmation for the following:"));
		console.log(formatIssuesSummary(prompts));
		console.log("");
		console.log(chalk.cyan("To proceed, either:"));
		console.log(
			chalk.white(
				"  1. Run this command in an interactive terminal to review and confirm each action",
			),
		);
		console.log(
			chalk.white(
				"  2. Run with --yes to automatically proceed with default actions",
			),
		);
		console.log("");

		// Exit with non-zero to indicate action required
		process.exit(1);
	}

	// Execute the push
	console.log(chalk.dim(`\nPushing to ${envLabel}...`));

	let result: HeadlessPushResult;
	if (prompts.length > 0) {
		// --yes was set, execute with defaults
		result = await executePushWithDefaults(config, analysis, prompts);
	} else {
		// No edge cases, clean push
		result = await executeCleanPush(config, analysis);
	}

	// Print summary
	console.log(chalk.green(`\nPush complete!`));

	if (result.featuresCreated.length > 0) {
		console.log(
			chalk.dim(`  Features created: ${result.featuresCreated.join(", ")}`),
		);
	}
	if (result.featuresUpdated.length > 0) {
		console.log(
			chalk.dim(`  Features updated: ${result.featuresUpdated.join(", ")}`),
		);
	}
	if (result.featuresDeleted.length > 0) {
		console.log(
			chalk.dim(`  Features deleted: ${result.featuresDeleted.join(", ")}`),
		);
	}
	if (result.featuresArchived.length > 0) {
		console.log(
			chalk.dim(`  Features archived: ${result.featuresArchived.join(", ")}`),
		);
	}
	if (result.plansCreated.length > 0) {
		console.log(
			chalk.dim(`  Plans created: ${result.plansCreated.join(", ")}`),
		);
	}
	if (result.plansUpdated.length > 0) {
		console.log(
			chalk.dim(`  Plans updated: ${result.plansUpdated.join(", ")}`),
		);
	}
	if (result.plansDeleted.length > 0) {
		console.log(
			chalk.dim(`  Plans deleted: ${result.plansDeleted.join(", ")}`),
		);
	}
	if (result.plansArchived.length > 0) {
		console.log(
			chalk.dim(`  Plans archived: ${result.plansArchived.join(", ")}`),
		);
	}

	return result;
}
