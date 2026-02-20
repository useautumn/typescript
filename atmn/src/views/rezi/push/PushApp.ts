/**
 * Rezi TUI implementation of the Push command view.
 * Replaces the React Ink PushView + usePush hook with a single async flow.
 */
import fs from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ui, rgb, type VNode } from "@rezi-ui/core";
import { createNodeApp } from "@rezi-ui/node";
import createJiti from "jiti";

import {
	analyzePush,
	archiveFeature as archiveFeatureApi,
	archivePlan as archivePlanApi,
	checkFeatureDeleteInfo,
	createFeatureArchivedPrompt,
	createFeatureDeletePrompt,
	createPlanArchivedPrompt,
	createPlanDeletePrompt,
	createPlanVersioningPrompt,
	createProdConfirmationPrompt,
	deleteFeature as deleteFeatureApi,
	deletePlan as deletePlanApi,
	fetchRemoteData,
	pushFeature,
	pushPlan,
	refreshPlansForVersioning,
	unarchiveFeature as unarchiveFeatureApi,
	unarchivePlan as unarchivePlanApi,
	validateConfig,
	formatValidationErrors,
	type FeatureDeleteInfo,
	type PushAnalysis,
	type PushPrompt,
	type PushResult,
} from "../../../commands/push/index.js";
import { writeConfig } from "../../../commands/pull/writeConfig.js";
import type { Feature, Plan } from "../../../compose/models/index.js";
import { fetchOrganizationMe } from "../../../lib/api/endpoints/index.js";
import { formatError } from "../../../lib/api/client.js";
import { AppEnv, getKey, resolveConfigPath } from "../../../lib/env/index.js";
import {
	card,
	colors,
	keyValue,
	loadingText,
	statusRow,
} from "../helpers.js";

// ── Types ──────────────────────────────────────────────────────────────────

type PushPhase =
	| "loading_config"
	| "loading_org"
	| "analyzing"
	| "no_changes"
	| "confirming"
	| "pushing_features"
	| "pushing_plans"
	| "deleting"
	| "complete"
	| "error";

type FeatureStatus = "pending" | "pushing" | "created" | "updated" | "deleted" | "archived" | "skipped";
type PlanStatus = "pending" | "pushing" | "created" | "updated" | "versioned" | "deleted" | "archived" | "skipped";

interface OrgInfo {
	name: string;
	slug: string;
	environment: "Sandbox" | "Live";
}

interface LocalConfig {
	features: Feature[];
	plans: Plan[];
}

interface PushState {
	phase: PushPhase;
	orgInfo: OrgInfo | null;
	localConfig: LocalConfig | null;
	analysis: PushAnalysis | null;
	error: string | null;
	promptQueue: PushPrompt[];
	currentPromptIndex: number;
	promptResponses: Map<string, string>;
	featureProgress: Map<string, FeatureStatus>;
	planProgress: Map<string, PlanStatus>;
	result: PushResult | null;
	remotePlans: Plan[];
	startTime: number;
}

const FRONTEND_URL = "https://app.useautumn.com";
const DISPLAY_LIMIT = 4;

// ── Config Loading ─────────────────────────────────────────────────────────

async function loadLocalConfig(cwd: string): Promise<LocalConfig> {
	const configPath = resolveConfigPath(cwd);
	if (!fs.existsSync(configPath)) {
		throw new Error(`Config file not found at ${configPath}. Run 'atmn pull' first.`);
	}

	const absolutePath = resolve(configPath);
	const fileUrl = pathToFileURL(absolutePath).href;
	const jiti = createJiti(import.meta.url);
	const mod = await jiti.import(fileUrl);

	const plans: Plan[] = [];
	const features: Feature[] = [];

	const modRecord = mod as { default?: unknown } & Record<string, unknown>;
	const defaultExport = modRecord.default as
		| { plans?: Plan[]; features?: Feature[]; products?: Plan[] }
		| undefined;

	if (defaultExport?.plans && defaultExport?.features) {
		if (Array.isArray(defaultExport.plans)) plans.push(...defaultExport.plans);
		if (Array.isArray(defaultExport.features)) features.push(...defaultExport.features);
	} else if (defaultExport?.products && defaultExport?.features) {
		if (Array.isArray(defaultExport.products)) plans.push(...defaultExport.products);
		if (Array.isArray(defaultExport.features)) features.push(...defaultExport.features);
	} else {
		for (const [key, value] of Object.entries(modRecord)) {
			if (key === "default") continue;
			const obj = value as { items?: unknown; type?: unknown };
			if (obj && typeof obj === "object") {
				if ("type" in obj) {
					features.push(obj as unknown as Feature);
				} else if (Array.isArray(obj.items) || "id" in obj) {
					plans.push(obj as unknown as Plan);
				}
			}
		}
	}

	return { features, plans };
}

function mergeArchivedFeaturesIntoConfig(
	localFeatures: Feature[],
	remoteFeatures: Feature[],
	archivedFeatureIds: string[],
): { features: Feature[]; hasChanges: boolean } {
	const uniqueIds = [...new Set(archivedFeatureIds)];
	if (uniqueIds.length === 0) return { features: localFeatures, hasChanges: false };

	const remoteFeatureMap = new Map(remoteFeatures.map((f) => [f.id, f]));
	const merged = new Map(localFeatures.map((f) => [f.id, f]));
	let hasChanges = false;

	for (const featureId of uniqueIds) {
		const existing = merged.get(featureId);
		if (existing) {
			if (existing.archived) continue;
			merged.set(featureId, { ...existing, archived: true });
			hasChanges = true;
			continue;
		}
		const remote = remoteFeatureMap.get(featureId);
		if (!remote) continue;
		merged.set(featureId, { ...(remote as Feature), archived: true });
		hasChanges = true;
	}

	return hasChanges
		? { features: Array.from(merged.values()), hasChanges: true }
		: { features: localFeatures, hasChanges: false };
}

// ── View Helpers ───────────────────────────────────────────────────────────

function featureStatusToDisplay(s: FeatureStatus): { status: "pending" | "loading" | "success" | "skipped"; action?: string } {
	switch (s) {
		case "pending": return { status: "pending" };
		case "pushing": return { status: "loading" };
		case "created": return { status: "success", action: "created" };
		case "updated": return { status: "success", action: "updated" };
		case "deleted": return { status: "success", action: "deleted" };
		case "archived": return { status: "success", action: "archived" };
		case "skipped": return { status: "skipped", action: "skipped" };
	}
}

function planStatusToDisplay(s: PlanStatus): { status: "pending" | "loading" | "success" | "skipped"; action?: string } {
	switch (s) {
		case "pending": return { status: "pending" };
		case "pushing": return { status: "loading" };
		case "created": return { status: "success", action: "created" };
		case "updated": return { status: "success", action: "updated" };
		case "versioned": return { status: "success", action: "versioned" };
		case "deleted": return { status: "success", action: "deleted" };
		case "archived": return { status: "success", action: "archived" };
		case "skipped": return { status: "skipped", action: "skipped" };
	}
}

function getPromptContent(prompt: PushPrompt): VNode[] {
	const getData = <T,>(key: string): T => prompt.data[key] as T;

	switch (prompt.type) {
		case "prod_confirmation":
			return [
				ui.text("You are about to push to PRODUCTION."),
				ui.text("This will affect live customers.", { style: { fg: colors.yellow } }),
			];
		case "plan_versioning":
			return [
				ui.text(`Plan "${getData<string>("planName")}" has customers on it.`),
				ui.text("Updating will create a new version.", { style: { fg: colors.yellow } }),
			];
		case "plan_delete_has_customers": {
			const count = getData<number>("customerCount");
			const firstName = getData<string>("firstCustomerName");
			const lines: VNode[] = [
				ui.text(`Plan "${prompt.entityId}" has ${count} customer${count > 1 ? "s" : ""}:`),
				ui.text(` - ${firstName}`, { style: { fg: colors.gray } }),
			];
			if (count > 1) lines.push(ui.text(` - ...and ${count - 1} others`, { style: { fg: colors.gray } }));
			lines.push(ui.text("You cannot delete plans that have been used by a customer.", { style: { fg: colors.yellow } }));
			return lines;
		}
		case "plan_delete_no_customers":
			return [
				ui.text(`Plan "${prompt.entityId}" is not in your config.`),
				ui.text("No customers are using this plan.", { style: { fg: colors.gray } }),
			];
		case "plan_archived":
			return [ui.text(`Plan "${getData<string>("planName")}" is currently archived.`)];
		case "feature_delete_credit_system": {
			const creditSystems = getData<string[]>("creditSystems");
			const first = getData<string>("firstCreditSystem");
			const lines: VNode[] = [
				ui.text(`Feature "${prompt.entityId}" is used by credit systems:`),
				ui.text(` - ${first}`, { style: { fg: colors.gray } }),
			];
			if (creditSystems.length > 1) lines.push(ui.text(` - ...and ${creditSystems.length - 1} others`, { style: { fg: colors.gray } }));
			lines.push(ui.text("Credit systems reference this feature for billing.", { style: { fg: colors.yellow } }));
			return lines;
		}
		case "feature_delete_products": {
			const productName = getData<string>("productName");
			const productCount = getData<number>("productCount");
			const lines: VNode[] = [
				ui.text(`Feature "${prompt.entityId}" is used by products:`),
				ui.text(` - ${productName}`, { style: { fg: colors.gray } }),
			];
			if (productCount > 1) lines.push(ui.text(` - ...and ${productCount - 1} others`, { style: { fg: colors.gray } }));
			lines.push(ui.text("Remove this feature from plans before deleting.", { style: { fg: colors.yellow } }));
			return lines;
		}
		case "feature_delete_no_deps":
			return [
				ui.text(`Feature "${prompt.entityId}" is not in your config.`),
				ui.text("No products are using this feature.", { style: { fg: colors.gray } }),
			];
		case "feature_archived":
			return [ui.text(`Feature "${getData<string>("featureId")}" is currently archived.`)];
		default:
			return [];
	}
}

function getPromptTitle(prompt: PushPrompt): string {
	switch (prompt.type) {
		case "prod_confirmation": return "⚠ Production Environment";
		case "plan_versioning": return "⚠ Plan Has Customers";
		case "plan_delete_has_customers": return "⚠ Cannot Delete Plan";
		case "plan_delete_no_customers": return "🗑 Delete Plan?";
		case "plan_archived": return "📦 Archived Plan";
		case "feature_delete_credit_system": return "⚠ Cannot Delete Feature";
		case "feature_delete_products": return "⚠ Cannot Delete Feature";
		case "feature_delete_no_deps": return "🗑 Delete Feature?";
		case "feature_archived": return "📦 Archived Feature";
		default: return "Prompt";
	}
}

// ── Main View ──────────────────────────────────────────────────────────────

function renderView(s: PushState): VNode {
	// Error state
	if (s.error) {
		return ui.column({ gap: 0, mb: 1 }, [
			ui.column({ px: 1 }, [
				ui.text("✗ Error pushing to Autumn", { style: { fg: colors.red, bold: true } }),
				ui.text(s.error, { style: { fg: colors.red } }),
			]),
		]);
	}

	const children: VNode[] = [];

	// Header
	children.push(card("🍂 Pushing to Autumn", []));

	// Loading config
	if (s.phase === "loading_config") {
		children.push(card("📂 Config", [loadingText("Loading autumn.config.ts...")]));
	}

	// Org card (show after config loaded)
	if (s.phase !== "loading_config") {
		if (!s.orgInfo || s.phase === "loading_org") {
			children.push(card("📦 Organization", [loadingText("Fetching...")]));
		} else {
			children.push(card("📦 Organization", [
				keyValue("Name", s.orgInfo.name),
				keyValue("Environment", s.orgInfo.environment),
			]));
		}
	}

	// Overview card (during/after analysis, not for no_changes)
	if (s.phase !== "loading_config" && s.phase !== "loading_org" && s.phase !== "no_changes") {
		if (s.phase === "analyzing" || !s.analysis) {
			children.push(card("📊 Overview", [loadingText("Analyzing changes...")]));
		} else if (s.analysis) {
			const a = s.analysis;
			const featuresToPush = a.featuresToCreate.length + a.featuresToUpdate.length;
			const featuresToDelete = a.featuresToDelete.length;
			const plansToPush = a.plansToCreate.length + a.plansToUpdate.length;
			const plansToDelete = a.plansToDelete.length;

			const overviewChildren: VNode[] = [];

			const featLine: VNode[] = [
				ui.text("Features: ", { style: { fg: colors.gray } }),
				ui.text(`${featuresToPush} to push`, { style: { fg: colors.green } }),
			];
			if (featuresToDelete > 0) featLine.push(ui.text(`, ${featuresToDelete} to delete`, { style: { fg: colors.red } }));
			overviewChildren.push(ui.row({}, featLine));

			const planLine: VNode[] = [
				ui.text("Plans: ", { style: { fg: colors.gray } }),
				ui.text(`${plansToPush} to push`, { style: { fg: colors.green } }),
			];
			if (plansToDelete > 0) planLine.push(ui.text(`, ${plansToDelete} to delete`, { style: { fg: colors.red } }));
			overviewChildren.push(ui.row({}, planLine));

			// Warnings
			if (a.archivedFeatures.length > 0) {
				overviewChildren.push(ui.text(`⚠ ${a.archivedFeatures.length} archived feature(s) in config`, { style: { fg: colors.yellow } }));
			}
			if (a.archivedPlans.length > 0) {
				overviewChildren.push(ui.text(`⚠ ${a.archivedPlans.length} archived plan(s) in config`, { style: { fg: colors.yellow } }));
			}
			const versioningPlans = a.plansToUpdate.filter((p) => p.willVersion);
			if (versioningPlans.length > 0) {
				overviewChildren.push(ui.text(`⚠ ${versioningPlans.length} plan(s) will create new versions`, { style: { fg: colors.yellow } }));
			}

			children.push(card("📊 Overview", overviewChildren));
		}
	}

	// No changes
	if (s.phase === "no_changes") {
		children.push(card("✅ No Changes", [
			ui.text("Your local config matches the remote."),
			ui.text("Nothing to push."),
		]));
		children.push(ui.column({ mt: 1 }, [ui.text("✨ Already in sync", { style: { fg: colors.green } })]));
	}

	// Current prompt
	if (s.phase === "confirming" && s.currentPromptIndex < s.promptQueue.length) {
		const prompt = s.promptQueue[s.currentPromptIndex];
		const content = getPromptContent(prompt);
		const title = getPromptTitle(prompt);
		children.push(
			ui.box({ border: "rounded", px: 1 }, [
				ui.text(title, { style: { fg: colors.yellow, bold: true } }),
				ui.column({ gap: 0, mt: 1 }, content),
				ui.select({
					id: `prompt-${prompt.id}`,
					value: prompt.options.find((o) => o.isDefault)?.value ?? prompt.options[0]?.value ?? "",
					options: prompt.options.map((o) => ({ value: o.value, label: o.label })),
					onChange: (value: string) => {
						// This will be handled by the prompt resolution logic
						promptResolve?.(value);
					},
				}),
			]),
		);
	}

	// Features card
	if (s.phase === "pushing_features" || s.phase === "pushing_plans" || s.phase === "deleting" || s.phase === "complete") {
		const a = s.analysis;
		if (a) {
			const allItems: Array<{ id: string; name: string }> = [
				...a.featuresToCreate.map((f) => ({ id: f.id, name: f.name })),
				...a.featuresToUpdate.map((f) => ({ id: f.id, name: f.name })),
				...a.featuresToDelete.map((d) => ({ id: d.id, name: d.id })),
			];

			if (allItems.length === 0) {
				children.push(card("🎯 Changed Features (0)", [
					ui.text("No features to push", { style: { fg: colors.gray } }),
				]));
			} else {
				const rows = allItems.slice(0, DISPLAY_LIMIT).map((item) => {
					const st = s.featureProgress.get(item.id) ?? "pending";
					const { status, action } = featureStatusToDisplay(st);
					return statusRow(status, item.name, item.id, action);
				});
				if (allItems.length > DISPLAY_LIMIT) {
					rows.push(ui.text(`...and ${allItems.length - DISPLAY_LIMIT} more`, { style: { fg: colors.gray } }));
				}
				children.push(card(`🎯 Changed Features (${allItems.length})`, rows));
			}
		}
	}

	// Plans card
	if (s.phase === "pushing_plans" || s.phase === "deleting" || s.phase === "complete") {
		const a = s.analysis;
		if (a) {
			const allPlans = [
				...a.plansToCreate.map((p) => ({ id: p.id, name: p.name })),
				...a.plansToUpdate.map((pi) => ({ id: pi.plan.id, name: pi.plan.name })),
				...a.plansToDelete.map((d) => ({ id: d.id, name: d.id })),
			];
			const totalCount = allPlans.length;

			if (totalCount === 0) {
				children.push(card("📋 Changed Plans (0)", [
					ui.text("No plans to push", { style: { fg: colors.gray } }),
				]));
			} else {
				const rows = allPlans.slice(0, DISPLAY_LIMIT).map((item) => {
					const st = s.planProgress.get(item.id) ?? "pending";
					const { status, action } = planStatusToDisplay(st);
					return statusRow(status, item.name, item.id, action);
				});
				if (totalCount > DISPLAY_LIMIT) {
					rows.push(ui.text(`...and ${totalCount - DISPLAY_LIMIT} more`, { style: { fg: colors.gray } }));
				}
				children.push(card(`📋 Changed Plans (${totalCount})`, rows));
			}
		}
	}

	// Completion
	if (s.phase === "complete") {
		const duration = ((Date.now() - s.startTime) / 1000).toFixed(1);
		const dashboardPath = s.orgInfo?.environment === "Live" ? "/products" : "/sandbox/products";
		children.push(ui.column({ mt: 1 }, [
			ui.text(`✨ Done in ${duration}s`, { style: { fg: colors.green } }),
			ui.text(`View at: ${FRONTEND_URL}${dashboardPath}`, { style: { fg: colors.magenta } }),
		]));
	}

	return ui.column({ gap: 0, mb: 1 }, children);
}

// ── Prompt resolution mechanism ────────────────────────────────────────────

let promptResolve: ((value: string) => void) | null = null;

function waitForPromptResponse(): Promise<string> {
	return new Promise<string>((resolve) => {
		promptResolve = resolve;
	});
}

// ── Main Entry Point ───────────────────────────────────────────────────────

export async function createPushApp(opts: {
	environment: AppEnv;
	yes?: boolean;
	onComplete?: () => void;
}): Promise<void> {
	const cwd = process.cwd();
	const environment = opts.environment;
	const yes = opts.yes ?? false;

	const initialState: PushState = {
		phase: "loading_config",
		orgInfo: null,
		localConfig: null,
		analysis: null,
		error: null,
		promptQueue: [],
		currentPromptIndex: 0,
		promptResponses: new Map(),
		featureProgress: new Map(),
		planProgress: new Map(),
		result: null,
		remotePlans: [],
		startTime: Date.now(),
	};

	const app = createNodeApp<PushState>({ initialState });
	app.view(renderView);
	await app.start();

	// Helper to update state
	const update = (fn: (s: PushState) => PushState) => app.update(fn);
	const setPhase = (phase: PushPhase) => update((s) => ({ ...s, phase }));
	const setError = (error: string) => update((s) => ({ ...s, error, phase: "error" as PushPhase }));

	try {
		// ── Phase 1: Load config ──
		let localConfig: LocalConfig;
		try {
			localConfig = await loadLocalConfig(cwd);
			const validation = validateConfig(localConfig.features, localConfig.plans);
			if (!validation.valid) {
				throw new Error(`Config validation failed:\n\n${formatValidationErrors(validation.errors)}`);
			}
			update((s) => ({ ...s, localConfig, phase: "loading_org" }));
		} catch (err) {
			setError(formatError(err));
			return;
		}

		// ── Phase 2: Load org info ──
		let orgInfo: OrgInfo;
		try {
			const secretKey = getKey(environment, cwd);
			const orgData = await fetchOrganizationMe({ secretKey });
			orgInfo = {
				name: orgData.name,
				slug: orgData.slug,
				environment: environment === AppEnv.Sandbox ? "Sandbox" : "Live",
			};
			update((s) => ({ ...s, orgInfo, phase: "analyzing" }));
		} catch (err) {
			setError(formatError(err));
			return;
		}

		// ── Phase 3: Analyze ──
		let analysis: PushAnalysis;
		let remotePlans: Plan[];
		try {
			const remoteData = await fetchRemoteData();
			remotePlans = remoteData.plans;
			analysis = await analyzePush(localConfig.features, localConfig.plans);
			update((s) => ({ ...s, analysis, remotePlans }));
		} catch (err) {
			setError(formatError(err));
			return;
		}

		// Check if there are any changes
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
			setPhase("no_changes");
			if (opts.onComplete) setTimeout(opts.onComplete, 1000);
			return;
		}

		// ── Build prompt queue ──
		const prompts: PushPrompt[] = [];

		if (environment === AppEnv.Live) {
			prompts.push(createProdConfirmationPrompt());
		}
		for (const feature of analysis.archivedFeatures) {
			prompts.push(createFeatureArchivedPrompt(feature));
		}
		for (const plan of analysis.archivedPlans) {
			prompts.push(createPlanArchivedPrompt(plan));
		}
		for (const planInfo of analysis.plansToUpdate) {
			if (planInfo.willVersion) {
				prompts.push(createPlanVersioningPrompt(planInfo));
			}
		}
		for (const info of analysis.featuresToDelete) {
			prompts.push(createFeatureDeletePrompt(info));
		}
		for (const info of analysis.plansToDelete) {
			prompts.push(createPlanDeletePrompt(info));
		}

		const promptResponses = new Map<string, string>();

		if (yes) {
			// Auto-respond to all prompts
			for (const prompt of prompts) {
				if (prompt.type === "prod_confirmation") {
					promptResponses.set(prompt.id, "confirm");
					continue;
				}
				const defaultOption = prompt.options.find((o) => o.isDefault);
				promptResponses.set(prompt.id, defaultOption?.value || prompt.options[0]?.value || "confirm");
			}
			update((s) => ({ ...s, promptQueue: prompts, currentPromptIndex: prompts.length, promptResponses, phase: "pushing_features" }));
		} else if (prompts.length === 0) {
			update((s) => ({ ...s, promptQueue: prompts, currentPromptIndex: 0, promptResponses, phase: "pushing_features" }));
		} else {
			// ── Phase 4: Confirming (interactive prompts) ──
			update((s) => ({ ...s, promptQueue: prompts, promptResponses, phase: "confirming" }));

			for (let i = 0; i < prompts.length; i++) {
				update((s) => ({ ...s, currentPromptIndex: i }));
				const response = await waitForPromptResponse();

				// Handle prod confirmation cancel
				if (prompts[i].type === "prod_confirmation" && response === "cancel") {
					setError("Push cancelled by user");
					return;
				}

				promptResponses.set(prompts[i].id, response);
				update((s) => ({ ...s, promptResponses: new Map(promptResponses) }));
			}

			update((s) => ({ ...s, currentPromptIndex: prompts.length, phase: "pushing_features" }));
		}

		// Local tracking for final result aggregation
		let featurePushCreated: string[] = [];
		let featurePushUpdated: string[] = [];
		let featurePushSkipped: string[] = [];
		let planPushCreated: string[] = [];
		let planPushUpdated: string[] = [];
		let planPushVersioned: string[] = [];
		let planPushSkipped: string[] = [];

		// ── Phase 5: Push features ──
		try {
			const created: string[] = [];
			const updated: string[] = [];
			const skipped: string[] = [];

			// Handle archived features that should be unarchived
			for (const feature of analysis.archivedFeatures) {
				const prompt = prompts.find((p) => p.type === "feature_archived" && p.entityId === feature.id);
				const response = prompt ? promptResponses.get(prompt.id) : undefined;
				if (response === "unarchive") {
					update((s) => ({ ...s, featureProgress: new Map(s.featureProgress).set(feature.id, "pushing") }));
					await unarchiveFeatureApi(feature.id);
				}
			}

			// Push all features
			const allFeatures = [
				...localConfig.features.filter((f) => !analysis.archivedFeatures.some((af) => af.id === f.id)),
				...localConfig.features.filter((f) => analysis.archivedFeatures.some((af) => af.id === f.id)),
			];

			for (const feature of allFeatures) {
				const isArchived = analysis.archivedFeatures.some((af) => af.id === feature.id);
				if (isArchived) {
					const prompt = prompts.find((p) => p.type === "feature_archived" && p.entityId === feature.id);
					const response = prompt ? promptResponses.get(prompt.id) : undefined;
					if (response === "skip") {
						skipped.push(feature.id);
						update((s) => ({ ...s, featureProgress: new Map(s.featureProgress).set(feature.id, "skipped") }));
						continue;
					}
				}

				update((s) => ({ ...s, featureProgress: new Map(s.featureProgress).set(feature.id, "pushing") }));
				const result = await pushFeature(feature);
				if (result.action === "created") {
					created.push(feature.id);
					update((s) => ({ ...s, featureProgress: new Map(s.featureProgress).set(feature.id, "created") }));
				} else {
					updated.push(feature.id);
					update((s) => ({ ...s, featureProgress: new Map(s.featureProgress).set(feature.id, "updated") }));
				}
			}

			featurePushCreated = created;
			featurePushUpdated = updated;
			featurePushSkipped = skipped;
			setPhase("pushing_plans");
		} catch (err) {
			setError(formatError(err));
			return;
		}

		// ── Phase 6: Push plans ──
		try {
			const created: string[] = [];
			const updated: string[] = [];
			const versioned: string[] = [];
			const skipped: string[] = [];

			const planUpdates = await refreshPlansForVersioning(
				analysis.plansToUpdate,
				localConfig.features,
			);
			const planUpdateById = new Map(planUpdates.map((pi) => [pi.plan.id, pi]));

			// Handle archived plans that should be unarchived
			for (const plan of analysis.archivedPlans) {
				const prompt = prompts.find((p) => p.type === "plan_archived" && p.entityId === plan.id);
				const response = prompt ? promptResponses.get(prompt.id) : undefined;
				if (response === "unarchive") {
					update((s) => ({ ...s, planProgress: new Map(s.planProgress).set(plan.id, "pushing") }));
					await unarchivePlanApi(plan.id);
				}
			}

			// Push plans to create
			for (const plan of analysis.plansToCreate) {
				update((s) => ({ ...s, planProgress: new Map(s.planProgress).set(plan.id, "pushing") }));
				await pushPlan(plan, remotePlans);
				created.push(plan.id);
				update((s) => ({ ...s, planProgress: new Map(s.planProgress).set(plan.id, "created") }));
			}

			// Push plans to update
			for (const planInfo of analysis.plansToUpdate) {
				const resolvedPlanInfo = planUpdateById.get(planInfo.plan.id) || planInfo;

				if (resolvedPlanInfo.willVersion) {
					const prompt = prompts.find((p) => p.type === "plan_versioning" && p.entityId === planInfo.plan.id);
					const response = prompt ? promptResponses.get(prompt.id) : undefined;
					if (response === "skip") {
						skipped.push(planInfo.plan.id);
						update((s) => ({ ...s, planProgress: new Map(s.planProgress).set(planInfo.plan.id, "skipped") }));
						continue;
					}
				}

				if (planInfo.isArchived) {
					const prompt = prompts.find((p) => p.type === "plan_archived" && p.entityId === planInfo.plan.id);
					const response = prompt ? promptResponses.get(prompt.id) : undefined;
					if (response === "skip") {
						skipped.push(planInfo.plan.id);
						update((s) => ({ ...s, planProgress: new Map(s.planProgress).set(planInfo.plan.id, "skipped") }));
						continue;
					}
				}

				update((s) => ({ ...s, planProgress: new Map(s.planProgress).set(planInfo.plan.id, "pushing") }));
				await pushPlan(planInfo.plan, remotePlans);

				if (resolvedPlanInfo.willVersion) {
					versioned.push(planInfo.plan.id);
					update((s) => ({ ...s, planProgress: new Map(s.planProgress).set(planInfo.plan.id, "versioned") }));
				} else {
					updated.push(planInfo.plan.id);
					update((s) => ({ ...s, planProgress: new Map(s.planProgress).set(planInfo.plan.id, "updated") }));
				}
			}

			planPushCreated = created;
			planPushUpdated = updated;
			planPushVersioned = versioned;
			planPushSkipped = skipped;
			setPhase("deleting");
		} catch (err) {
			setError(formatError(err));
			return;
		}

		// ── Phase 7: Deletions ──
		try {
			const featuresDeleted: string[] = [];
			const featuresArchived: string[] = [];
			const featuresSkipped: string[] = [];
			const plansDeleted: string[] = [];
			const plansArchived: string[] = [];
			const plansSkipped: string[] = [];

			// Handle plan deletions
			for (const info of analysis.plansToDelete) {
				const prompt = prompts.find((p) => p.type.startsWith("plan_delete") && p.entityId === info.id);
				const response = prompt ? promptResponses.get(prompt.id) : undefined;

				if (response === "delete") {
					update((s) => ({ ...s, planProgress: new Map(s.planProgress).set(info.id, "pushing") }));
					await deletePlanApi(info.id);
					plansDeleted.push(info.id);
					update((s) => ({ ...s, planProgress: new Map(s.planProgress).set(info.id, "deleted") }));
				} else if (response === "archive") {
					update((s) => ({ ...s, planProgress: new Map(s.planProgress).set(info.id, "pushing") }));
					await archivePlanApi(info.id);
					plansArchived.push(info.id);
					update((s) => ({ ...s, planProgress: new Map(s.planProgress).set(info.id, "archived") }));
				} else {
					plansSkipped.push(info.id);
					update((s) => ({ ...s, planProgress: new Map(s.planProgress).set(info.id, "skipped") }));
				}
			}

			// Refresh feature delete info
			const refreshedFeatureDeleteInfo = new Map<string, FeatureDeleteInfo>();
			let remoteDataForFeatureSync: Feature[] | null = null;

			if (analysis.featuresToDelete.length > 0) {
				const remoteData = await fetchRemoteData();
				remoteDataForFeatureSync = remoteData.features;
				const refreshedInfos = await Promise.all(
					analysis.featuresToDelete.map((featureInfo) =>
						checkFeatureDeleteInfo(featureInfo.id, localConfig.features, remoteData.features),
					),
				);
				for (const info of refreshedInfos) {
					refreshedFeatureDeleteInfo.set(info.id, info);
				}
			}

			// Handle feature deletions
			for (const info of analysis.featuresToDelete) {
				const prompt = prompts.find((p) => p.type.startsWith("feature_delete") && p.entityId === info.id);
				const response = prompt ? promptResponses.get(prompt.id) : undefined;
				const latestInfo = refreshedFeatureDeleteInfo.get(info.id) ?? info;

				if (response === "delete") {
					if (!latestInfo.canDelete) {
						featuresSkipped.push(info.id);
						update((s) => ({ ...s, featureProgress: new Map(s.featureProgress).set(info.id, "skipped") }));
						continue;
					}
					update((s) => ({ ...s, featureProgress: new Map(s.featureProgress).set(info.id, "pushing") }));
					await deleteFeatureApi(info.id);
					featuresDeleted.push(info.id);
					update((s) => ({ ...s, featureProgress: new Map(s.featureProgress).set(info.id, "deleted") }));
				} else if (response === "archive") {
					update((s) => ({ ...s, featureProgress: new Map(s.featureProgress).set(info.id, "pushing") }));
					await archiveFeatureApi(info.id);
					featuresArchived.push(info.id);
					update((s) => ({ ...s, featureProgress: new Map(s.featureProgress).set(info.id, "archived") }));
				} else {
					featuresSkipped.push(info.id);
					update((s) => ({ ...s, featureProgress: new Map(s.featureProgress).set(info.id, "skipped") }));
				}
			}

			// Merge archived features into config file
			if (featuresArchived.length > 0) {
				if (!remoteDataForFeatureSync) {
					const remoteData = await fetchRemoteData();
					remoteDataForFeatureSync = remoteData.features;
				}
				const { features: mergedFeatures, hasChanges } = mergeArchivedFeaturesIntoConfig(
					localConfig.features,
					remoteDataForFeatureSync,
					featuresArchived,
				);
				if (hasChanges) {
					await writeConfig(mergedFeatures, localConfig.plans, cwd);
				}
			}

			// Build final result — use local tracking variables
			const finalResult: PushResult = {
				featuresCreated: featurePushCreated,
				featuresUpdated: featurePushUpdated,
				featuresDeleted,
				featuresArchived,
				featuresSkipped: [...featurePushSkipped, ...featuresSkipped],
				plansCreated: planPushCreated,
				plansUpdated: planPushUpdated,
				plansVersioned: planPushVersioned,
				plansDeleted,
				plansArchived,
				plansSkipped: [...planPushSkipped, ...plansSkipped],
			};

			update((s) => ({ ...s, result: finalResult, phase: "complete" }));

			if (opts.onComplete) {
				setTimeout(opts.onComplete, 1000);
			}
		} catch (err) {
			setError(formatError(err));
		}
	} catch (err) {
		setError(formatError(err));
	}
}
