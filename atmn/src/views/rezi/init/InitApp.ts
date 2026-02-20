/**
 * Rezi TUI app for the `atmn init` command.
 * Multi-step wizard: Auth → Path (if monorepo) → Config → Handoff
 * Also exports headless init for non-TTY environments.
 */
import { ui, rgb, type VNode } from "@rezi-ui/core";
import { createNodeApp } from "@rezi-ui/node";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import open from "open";
import clipboard from "clipboardy";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

import { ASCII_TITLE } from "../../../constants.js";
import { FRONTEND_URL } from "../../../constants.js";
import { CLI_CLIENT_ID } from "../../../commands/auth/constants.js";
import {
	getApiKeysWithToken,
	startOAuthFlow,
} from "../../../commands/auth/oauth.js";
import { fetchOrganizationMe } from "../../../lib/api/endpoints/index.js";
import {
	fetchFeatures,
	fetchPlans,
	fetchOrganization,
} from "../../../lib/api/endpoints/index.js";
import { readFromEnv } from "../../../lib/utils.js";
import { storeEnvKeys } from "../../../lib/hooks/useEnvironmentStore.js";
import { request } from "../../../lib/api/client.js";
import { pull } from "../../../commands/pull/pull.js";
import { writeEmptyConfig } from "../../../lib/writeEmptyConfig.js";
import { AppEnv, getKey } from "../../../lib/env/index.js";
import { detectMonorepo, type MonorepoInfo } from "../../../lib/utils/monorepo.js";
import { templateConfigs } from "../../../lib/constants/templates/index.js";
import { buildConfigFile } from "../../../lib/transforms/sdkToCode/configFile.js";
import { resolveConfigPath } from "../../../lib/env/cliContext.js";
import { skills } from "../../../prompts/skills/index.js";
import {
	templates as v2Templates,
	type Template,
	type TemplateTier,
	type TemplateCreditCost,
} from "../../../views/react/template2/data.js";
import { card, colors, loadingText, stepHeader, statusRow } from "../helpers.js";

const execAsync = promisify(exec);
const MCP_URL = "https://docs.useautumn.com/mcp";

// ─── State types ─────────────────────────────────────────────────────────────
type Step = "auth" | "path" | "config" | "handoff";

type AuthSubState = "checking" | "not_authenticated" | "authenticating" | "authenticated" | "error";
type ConfigSubState =
	| "loading"
	| "choosing"
	| "pulling"
	| "nuking"
	| "post_nuke_choice"
	| "template"
	| "complete"
	| "error";
type HandoffSubState =
	| "ai_choice"
	| "location_choice"
	| "custom_path_input"
	| "creating_skills"
	| "next_steps"
	| "complete_with_customers"
	| "manual_exit";

interface OrgInfo {
	name: string;
	slug: string;
}

interface InitState {
	currentStep: Step;
	totalSteps: number;
	monorepoInfo: MonorepoInfo | null;
	targetPath: string;
	hasPricing: boolean;
	hasCustomers: boolean;
	orgInfo: OrgInfo | null;

	// Auth
	authSubState: AuthSubState;
	authError: string | null;

	// Path
	pathInput: string;
	pathState: "input" | "creating" | "complete" | "error";
	pathError: string | null;

	// Config
	configSubState: ConfigSubState;
	configError: string | null;
	plansCount: number;
	featuresCount: number;
	hasExistingConfig: boolean;
	configMenuSelection: string;
	postNukeMenuSelection: string;
	completionAction: string | null;

	// Template
	templateSelectedIndex: number;

	// Pull sub-flow
	pullIsLoading: boolean;
	pullIsSuccess: boolean;

	// Handoff
	handoffSubState: HandoffSubState;
	aiChoiceSelection: string;
	locationSelections: string[];
	customPathInput: string;
	createdSkillsDirs: string[];
	createdSkillsFiles: string[];
	nextStepSelection: string;
	lastNextStepChoice: string;
	clipboardFeedback: boolean;

	// Stripe
	stripeState: "pending" | "checking" | "not_connected" | "connecting" | "connected" | "error";
	stripeError: string | null;
}

// ─── Width calculators for template ──────────────────────────────────────────
function calculatePlanWidth(tier: TemplateTier): number {
	const titleWidth = tier.name.length;
	const priceWidth = tier.price.length;
	const maxFeatureWidth = Math.max(...tier.features.map((f) => f.length + 2));
	return Math.max(titleWidth, priceWidth, maxFeatureWidth) + 6;
}

function calculateCreditSchemaWidth(costs: TemplateCreditCost[]): number {
	const titleWidth = "Credit Costs".length;
	const maxRowWidth = Math.max(
		...costs.map((c) => c.action.length + 2 + c.credits.length),
	);
	return Math.max(titleWidth, maxRowWidth) + 6;
}

// Precompute global widths
let globalTierWidth = 0;
let globalCreditSchemaWidth = 0;
for (const template of v2Templates) {
	for (const tier of template.tiers) {
		const w = calculatePlanWidth(tier);
		if (w > globalTierWidth) globalTierWidth = w;
	}
	if (template.creditSystem?.costs) {
		const w = calculateCreditSchemaWidth(template.creditSystem.costs);
		if (w > globalCreditSchemaWidth) globalCreditSchemaWidth = w;
	}
}

const PLAN_COLORS = [colors.yellow, colors.green, colors.cyan, colors.magenta] as const;
const BADGE_COLORS: Record<string, ReturnType<typeof rgb>> = {
	cyan: colors.cyan, yellow: colors.yellow, green: colors.green,
	blue: rgb(80, 140, 255), gray: colors.gray, magenta: colors.magenta,
};

// ─── Template sub-renderers ──────────────────────────────────────────────────
function renderTemplatePlanCard(tier: TemplateTier, index: number): VNode {
	const titleColor = PLAN_COLORS[index % PLAN_COLORS.length];
	return ui.box({ border: "rounded", px: 1, width: globalTierWidth }, [
		ui.row({ gap: 1 }, [
			ui.text(tier.name, { style: { fg: titleColor, bold: true } }),
			ui.text(tier.price, { style: { fg: colors.green } }),
		]),
		ui.column({}, tier.features.map((f, i) =>
			ui.text(`• ${f}`, { key: `f-${i}`, style: { dim: true } }),
		)),
	]);
}

function renderTemplateSelector(s: InitState): VNode {
	const children: VNode[] = [
		ui.row({ gap: 1 }, [
			ui.text("◆", { style: { fg: colors.yellow } }),
			ui.text("Select a pricing template:", { style: { bold: true } }),
		]),
		ui.text("Press ↑↓ to navigate, Enter to select, Esc to go back", { style: { dim: true } }),
	];

	for (let i = 0; i < v2Templates.length; i++) {
		const template = v2Templates[i];
		const isSelected = i === s.templateSelectedIndex;
		const indicator = isSelected
			? ui.text("●", { style: { fg: colors.cyan, bold: true } })
			: ui.text("○", { style: { dim: true } });

		const headerParts: VNode[] = [indicator, ui.text(template.name, {
			style: { fg: isSelected ? colors.cyan : colors.white, bold: isSelected },
		})];
		for (let j = 0; j < template.badges.length; j++) {
			const badge = template.badges[j];
			const fg = BADGE_COLORS[badge.color] ?? colors.gray;
			headerParts.push(ui.text(` ${badge.label} `, { key: `b-${template.id}-${j}`, style: { fg: colors.white, bold: true, bg: fg } }));
		}

		if (!isSelected) {
			children.push(ui.row({ gap: 1 }, headerParts));
		} else {
			const expanded: VNode[] = [ui.text(template.description, { style: { dim: true } })];
			const tierCards = template.tiers.map((t, idx) => renderTemplatePlanCard(t, idx));
			const cardsRow: VNode[] = [ui.column({}, tierCards)];
			if (template.creditSystem && template.creditSystem.costs.length > 0) {
				let tiersH = 0;
				for (const t of template.tiers) tiersH += 2 + 1 + t.features.length;
				const costRows = template.creditSystem.costs.map((c) =>
					ui.row({ key: c.action, gap: 2 }, [
						ui.text(c.action, { style: { dim: true } }),
						ui.text(c.credits, { style: { fg: colors.yellow } }),
					]),
				);
				cardsRow.push(ui.box({ border: "rounded", px: 1, width: globalCreditSchemaWidth, height: tiersH }, [
					ui.text("Credit Costs", { style: { fg: colors.cyan, bold: true } }),
					ui.column({}, costRows),
				]));
			}
			expanded.push(ui.row({ mt: 1, gap: 1 }, cardsRow));
			expanded.push(ui.row({ mt: 1 }, [
				ui.text("Press ", { style: { dim: true } }),
				ui.text("Enter", { style: { bold: true } }),
				ui.text(" to use this template", { style: { dim: true } }),
			]));
			children.push(ui.column({}, [
				ui.row({ gap: 1 }, headerParts),
				ui.box({ ml: 1, border: "single", pl: 1 }, [ui.column({}, expanded)]),
			]));
		}
	}

	return ui.column({ px: 1, py: 1 }, children);
}

// ─── Main view ───────────────────────────────────────────────────────────────
function renderInit(s: InitState): VNode {
	const sections: VNode[] = [];

	// ASCII Title
	sections.push(ui.text(ASCII_TITLE));
	sections.push(
		ui.row({}, [
			ui.text("Welcome to "),
			ui.text("Autumn", { style: { fg: colors.magenta, bold: true } }),
			ui.text("! Let's set up your billing."),
		]),
	);

	// Step 1: Auth
	sections.push(renderAuthStep(s));

	// Step 2 (optional): Path
	if (s.monorepoInfo?.detected &&
		(s.currentStep === "path" || s.currentStep === "config" || s.currentStep === "handoff")) {
		sections.push(renderPathStep(s));
	}

	// Step 3: Config
	if (s.currentStep === "config" || s.currentStep === "handoff") {
		sections.push(renderConfigStep(s));
	}

	// Step 4: Handoff
	if (s.currentStep === "handoff") {
		sections.push(renderHandoffStep(s));
	}

	return ui.column({ px: 1 }, sections);
}

function renderAuthStep(s: InitState): VNode {
	const stepNum = 1;
	const children: VNode[] = [stepHeader(stepNum, s.totalSteps, "Authentication")];

	if (s.authSubState === "checking") {
		children.push(statusRow("loading", "Checking authentication..."));
	} else if (s.authSubState === "not_authenticated") {
		children.push(statusRow("loading", "Opening browser for login..."));
	} else if (s.authSubState === "authenticating") {
		children.push(statusRow("loading", "Waiting for authentication..."));
	} else if (s.authSubState === "authenticated" && s.orgInfo) {
		children.push(statusRow("success", `Logged in as ${s.orgInfo.name}`, s.orgInfo.slug));
	} else if (s.authSubState === "error") {
		children.push(statusRow("error", s.authError || "Authentication failed"));
	}

	return ui.column({ mb: 1 }, children);
}

function renderPathStep(s: InitState): VNode {
	const stepNum = 2;
	const children: VNode[] = [stepHeader(stepNum, s.totalSteps, "Project Location")];

	if (s.pathState === "input") {
		children.push(ui.text(`We've detected you're using a monorepo (${s.monorepoInfo?.reason || "monorepo structure"}).`));
		children.push(ui.text("Where would you like to save your Autumn config files?"));
		children.push(
			ui.row({}, [
				ui.text("Path: "),
				ui.input({
					id: "path-input",
					value: s.pathInput,
					onInput: (v) => app.update((prev) => ({ ...prev, pathInput: v })),
				}),
			]),
		);
		children.push(ui.text("(relative or absolute - folders will be created if needed)", { style: { dim: true } }));
	} else if (s.pathState === "creating") {
		children.push(statusRow("loading", "Creating directory..."));
	} else if (s.pathState === "complete") {
		children.push(statusRow("success", `Files will be saved to: ${s.pathInput.trim() === "" ? "current directory" : s.pathInput}`));
	} else if (s.pathState === "error") {
		children.push(statusRow("error", s.pathError || "Failed to create directory"));
	}

	return ui.column({ mb: 1 }, children);
}

function renderConfigStep(s: InitState): VNode {
	const stepNum = s.monorepoInfo?.detected ? 3 : 2;
	const children: VNode[] = [stepHeader(stepNum, s.totalSteps, "Configuration")];

	if (s.configSubState === "loading") {
		children.push(statusRow("loading", "Checking your sandbox..."));
	} else if (s.configSubState === "choosing") {
		if (s.hasExistingConfig) {
			children.push(ui.text("Found existing pricing in your sandbox:"));
		} else {
			children.push(ui.text("Your sandbox is empty. How do you want to start?"));
		}
		const menuOptions = s.hasExistingConfig
			? [
					{ value: "pull", label: `Pull existing (${s.plansCount} plan${s.plansCount !== 1 ? "s" : ""}, ${s.featuresCount} feature${s.featuresCount !== 1 ? "s" : ""})` },
					{ value: "nuke", label: "Nuke and start fresh" },
				]
			: [
					{ value: "template", label: "Use a template" },
					{ value: "blank", label: "Start from scratch" },
				];
		children.push(
			ui.select({
				id: "config-menu",
				value: s.configMenuSelection,
				options: menuOptions,
				onChange: (v) => handleConfigMenuSelect(v),
			}),
		);
	} else if (s.configSubState === "pulling") {
		children.push(statusRow("loading", "Pulling configuration..."));
		if (s.pullIsSuccess) {
			children.push(statusRow("success", "Config pulled"));
		}
	} else if (s.configSubState === "post_nuke_choice") {
		children.push(statusRow("success", "Sandbox cleared"));
		children.push(ui.text("Now, how do you want to set up your pricing?"));
		children.push(
			ui.select({
				id: "post-nuke-menu",
				value: s.postNukeMenuSelection,
				options: [
					{ value: "template", label: "Use a template" },
					{ value: "blank", label: "Start from scratch" },
				],
				onChange: (v) => handlePostNukeSelect(v),
			}),
		);
	} else if (s.configSubState === "template") {
		children.push(renderTemplateSelector(s));
	} else if (s.configSubState === "complete") {
		const msg = s.completionAction === "blank"
			? "Created autumn.config.ts"
			: s.completionAction === "template"
				? "Config ready"
				: s.completionAction === "pull"
					? "Config pulled"
					: "Config reset";
		children.push(statusRow("success", msg));
	} else if (s.configSubState === "error") {
		children.push(statusRow("error", s.configError || "Something went wrong"));
	}

	return ui.column({ mb: 1 }, children);
}

function renderHandoffStep(s: InitState): VNode {
	const stepNum = s.monorepoInfo?.detected ? 4 : 3;
	const children: VNode[] = [stepHeader(stepNum, s.totalSteps, "Next Steps")];

	if (s.handoffSubState === "complete_with_customers") {
		children.push(statusRow("success", "You're all set - next, run atmn push when you're ready to sync your config."));
		children.push(ui.text("Docs: https://docs.useautumn.com", { style: { dim: true } }));
		children.push(ui.text("Discord: https://discord.gg/atmn", { style: { dim: true } }));
	} else if (s.handoffSubState === "ai_choice") {
		children.push(ui.text("Would you like to install AI skills to help model your pricing plans and implement Autumn into your codebase?"));
		children.push(
			ui.select({
				id: "ai-choice",
				value: s.aiChoiceSelection,
				options: [
					{ value: "yes", label: "Yes" },
					{ value: "no", label: "No thanks" },
				],
				onChange: (v) => handleAiChoice(v),
			}),
		);
	} else if (s.handoffSubState === "location_choice") {
		children.push(ui.text("Where should we save the skills?"));
		children.push(ui.text("(select one)", { style: { dim: true } }));
		children.push(
			ui.select({
				id: "location-choice",
				value: s.locationSelections[0] ?? ".claude/skills",
				options: [
					{ value: ".claude/skills", label: ".claude/skills (Claude Code)" },
					{ value: ".agents/skills", label: ".agents/skills (OpenCode, Cursor, Amp, Codex...)" },
					{ value: "custom", label: "Custom path..." },
				],
				onChange: (v) => handleLocationSelect(v),
			}),
		);
	} else if (s.handoffSubState === "custom_path_input") {
		children.push(ui.text("Enter the custom path (relative to project root):"));
		children.push(
			ui.row({}, [
				ui.text("> ", { style: { fg: colors.gray } }),
				ui.input({
					id: "custom-path-input",
					value: s.customPathInput,
					onInput: (v) => app.update((prev) => ({ ...prev, customPathInput: v })),
				}),
			]),
		);
	} else if (s.handoffSubState === "creating_skills") {
		children.push(statusRow("loading", "Setting up your skills..."));
	} else if (s.handoffSubState === "next_steps") {
		// Show created skills if any
		if (s.createdSkillsDirs.length > 0) {
			children.push(statusRow("success", "Skills created!"));
			for (const dir of s.createdSkillsDirs) {
				children.push(ui.text(`${dir}/`, { style: { fg: colors.cyan } }));
				for (let i = 0; i < s.createdSkillsFiles.length; i++) {
					const prefix = i === s.createdSkillsFiles.length - 1 ? "└── " : "├── ";
					children.push(ui.text(`${prefix}${s.createdSkillsFiles[i]}`, { style: { fg: colors.cyan } }));
				}
			}
		}
		children.push(ui.text("What would you like to do next?"));
		if (s.clipboardFeedback) {
			children.push(ui.text("Copied to clipboard!", { style: { fg: colors.green } }));
		}
		children.push(
			ui.select({
				id: "next-steps",
				value: s.nextStepSelection,
				options: [
					{ value: "docs", label: "Open Autumn docs" },
					{ value: "copy", label: "Copy our AI system prompt to implement Autumn for you" },
					{ value: "exit", label: "Thanks, I'll figure it out myself" },
				],
				onChange: (v) => handleNextStepChoice(v),
			}),
		);
	} else if (s.handoffSubState === "manual_exit") {
		const finalMessage =
			s.lastNextStepChoice === "docs"
				? "You're all set - we're opening the docs now for you."
				: s.lastNextStepChoice === "copy"
					? "You're all set - paste the prompt we copied into your agent of choice to get started."
					: "You're all set - next, run atmn push when you're ready to sync your config.";
		children.push(statusRow("success", finalMessage));
		children.push(ui.text("Docs: https://docs.useautumn.com", { style: { dim: true } }));
		children.push(ui.text("Discord: https://discord.gg/atmn", { style: { dim: true } }));
		children.push(
			ui.row({}, [
				ui.text("Run ", { style: { dim: true } }),
				ui.text("atmn push", { style: { fg: colors.magenta } }),
				ui.text(" when you're ready to sync your config", { style: { dim: true } }),
			]),
		);
	}

	return ui.column({ mb: 1 }, children);
}

// ─── App instance (module-level for closures) ────────────────────────────────
let app: ReturnType<typeof createNodeApp<InitState>>;
let currentState: InitState;

const SYSTEM_PROMPT = `You are an expert AI assistant that helps users set up Autumn, a billing and entitlements layer over Stripe. The user has already installed Autumn Skills ready for you to use the load skill tool.

The user's business structure in terms of its billing, pricing, plans and features are set out in a file called 'autumn.config.ts'.
If this file is empty, then you should help the user model their pricing structure by loading the 'autumn-modelling-pricing-plans' skill. If there is no pricing structure - you MUST initiate the user into a discussion about the plans they want, the prices of each, the limits, how often usage should reset, how much usage they should get etc... Do not make any decisions on that regard on your own. Make these prompts conversational; Don't ask every question to the user immediately. Ask for a general overview and then make follow up questions until you or the user is sure.

Once a pricing model is either decided upon or already found to exist already continue onwards:

- Begin by helping the user create their first customer in Autumn by loading the 'autumn-creating-customer' skill.
- Then setup accepting payments by loading the 'autumn-accepting-payments' skill.
- Lastly start tracking usage by loading the 'autumn-tracking-usage' skill.`;

// ─── Action handlers ─────────────────────────────────────────────────────────

async function performAuth() {
	try {
		app.update((s) => ({ ...s, authSubState: "authenticating" }));
		const { tokens } = await startOAuthFlow(CLI_CLIENT_ID);
		const { sandboxKey, prodKey } = await getApiKeysWithToken(tokens.access_token);
		await storeEnvKeys({ prodKey, sandboxKey }, { forceOverwrite: true });
		const info = await fetchOrganizationMe({ secretKey: sandboxKey });
		const orgInfo: OrgInfo = { name: info.name, slug: info.slug };
		app.update((s) => ({ ...s, authSubState: "authenticated", orgInfo }));
		handleAuthComplete(orgInfo);
	} catch (err) {
		app.update((s) => ({
			...s,
			authSubState: "error",
			authError: err instanceof Error ? err.message : "Authentication failed",
		}));
	}
}

function handleAuthComplete(orgInfo: OrgInfo) {
	const detected = detectMonorepo();
	const totalSteps = detected.detected ? 4 : 3;

	if (detected.detected) {
		app.update((s) => ({
			...s,
			monorepoInfo: detected,
			totalSteps,
			currentStep: "path",
		}));
	} else {
		app.update((s) => ({
			...s,
			monorepoInfo: detected,
			totalSteps,
			currentStep: "config",
		}));
		loadConfigCounts();
	}
}

async function handlePathSubmit() {
	const state = currentState;
	if (state.pathState !== "input") return;
	app.update((s) => ({ ...s, pathState: "creating" }));

	try {
		const pathToUse = state.pathInput.trim() || ".";
		const absolutePath = resolve(process.cwd(), pathToUse);
		await mkdir(absolutePath, { recursive: true });
		app.update((s) => ({
			...s,
			pathState: "complete",
			targetPath: absolutePath,
			currentStep: "config",
		}));
		loadConfigCounts();
	} catch (err) {
		app.update((s) => ({
			...s,
			pathState: "error",
			pathError: err instanceof Error ? err.message : "Failed to create directory",
		}));
	}
}

async function loadConfigCounts() {
	app.update((s) => ({ ...s, configSubState: "loading" }));
	try {
		const sandboxKey = getKey(AppEnv.Sandbox);
		const [features, plans] = await Promise.all([
			fetchFeatures({ secretKey: sandboxKey }),
			fetchPlans({ secretKey: sandboxKey }),
		]);
		const plansCount = plans.length;
		const featuresCount = features.length;
		const hasExistingConfig = plansCount > 0 || featuresCount > 0;
		app.update((s) => ({
			...s,
			configSubState: "choosing",
			plansCount,
			featuresCount,
			hasExistingConfig,
			configMenuSelection: hasExistingConfig ? "pull" : "template",
		}));
	} catch (err) {
		app.update((s) => ({
			...s,
			configSubState: "error",
			configError: err instanceof Error ? err.message : "Failed to fetch configuration",
		}));
	}
}

function handleConfigMenuSelect(value: string) {
	app.update((s) => ({ ...s, configMenuSelection: value }));

	if (value === "pull") {
		handlePull();
	} else if (value === "nuke") {
		handleNuke();
	} else if (value === "template") {
		app.update((s) => ({ ...s, configSubState: "template" }));
	} else if (value === "blank") {
		handleBlank();
	}
}

function handlePostNukeSelect(value: string) {
	app.update((s) => ({ ...s, postNukeMenuSelection: value }));
	if (value === "template") {
		app.update((s) => ({ ...s, completionAction: "nuke", configSubState: "template" }));
	} else if (value === "blank") {
		handleBlank();
	}
}

async function handlePull() {
	const state = currentState;
	app.update((s) => ({ ...s, configSubState: "pulling", pullIsLoading: true }));
	try {
		await pull({
			generateSdkTypes: true,
			cwd: state.targetPath,
			environment: AppEnv.Sandbox,
		});
		app.update((s) => ({
			...s,
			pullIsLoading: false,
			pullIsSuccess: true,
			completionAction: "pull",
			configSubState: "complete",
		}));
		setTimeout(() => moveToHandoff(true), 1000);
	} catch (err) {
		app.update((s) => ({
			...s,
			configSubState: "error",
			configError: err instanceof Error ? err.message : "Pull failed",
		}));
	}
}

async function handleNuke() {
	app.update((s) => ({ ...s, configSubState: "loading" }));
	try {
		const sandboxKey = getKey(AppEnv.Sandbox);
		const [features, plans] = await Promise.all([
			fetchFeatures({ secretKey: sandboxKey }),
			fetchPlans({ secretKey: sandboxKey }),
		]);
		// Delete all features and plans
		for (const f of features) {
			await request({ method: "DELETE", path: `/v1/features/${f.id}`, secretKey: sandboxKey });
		}
		for (const p of plans) {
			await request({ method: "DELETE", path: `/v1/plans/${p.id}`, secretKey: sandboxKey });
		}
		app.update((s) => ({
			...s,
			configSubState: "post_nuke_choice",
			postNukeMenuSelection: "template",
		}));
	} catch (err) {
		app.update((s) => ({
			...s,
			configSubState: "error",
			configError: err instanceof Error ? err.message : "Nuke failed",
		}));
	}
}

function handleBlank() {
	const state = currentState;
	try {
		writeEmptyConfig(state.targetPath || undefined);
		app.update((s) => ({
			...s,
			completionAction: "blank",
			configSubState: "complete",
		}));
		setTimeout(() => moveToHandoff(false), 1000);
	} catch (err) {
		app.update((s) => ({
			...s,
			configSubState: "error",
			configError: err instanceof Error ? err.message : "Failed to write config",
		}));
	}
}

async function handleTemplateSelect(templateName: string) {
	const state = currentState;
	try {
		const config = templateConfigs[templateName];
		if (!config) throw new Error(`Unknown template: ${templateName}`);
		const configContent = buildConfigFile(config.features, config.plans);
		const configPath = state.targetPath
			? path.resolve(state.targetPath, "autumn.config.ts")
			: resolveConfigPath();
		const fsSync = await import("node:fs");
		fsSync.writeFileSync(configPath, configContent, "utf-8");
		app.update((s) => ({
			...s,
			completionAction: "template",
			configSubState: "complete",
		}));
		setTimeout(() => moveToHandoff(true), 1000);
	} catch (err) {
		app.update((s) => ({
			...s,
			configSubState: "error",
			configError: err instanceof Error ? err.message : "Failed to write template config",
		}));
	}
}

async function moveToHandoff(hasPricing: boolean) {
	app.update((s) => ({ ...s, hasPricing }));

	// Check if org has customers
	try {
		const sandboxKey = getKey(AppEnv.Sandbox);
		const response = await request<{ list: unknown[]; has_more: boolean }>({
			method: "POST",
			path: "/v1/customers/list",
			secretKey: sandboxKey,
			body: { limit: 1, offset: 0 },
		});
		const hasCustomers = response.list.length > 0;
		app.update((s) => ({
			...s,
			hasCustomers,
			currentStep: "handoff",
			handoffSubState: hasCustomers ? "complete_with_customers" : "ai_choice",
		}));
		if (hasCustomers) {
			setTimeout(() => {
				app.stop();
				process.exit(0);
			}, 900);
		}
	} catch {
		app.update((s) => ({
			...s,
			currentStep: "handoff",
			handoffSubState: "ai_choice",
		}));
	}
}

function handleAiChoice(value: string) {
	app.update((s) => ({ ...s, aiChoiceSelection: value }));
	if (value === "no") {
		app.update((s) => ({ ...s, handoffSubState: "next_steps" }));
	} else {
		app.update((s) => ({ ...s, handoffSubState: "location_choice" }));
	}
}

function handleLocationSelect(value: string) {
	app.update((s) => ({ ...s, locationSelections: [value] }));
	if (value === "custom") {
		app.update((s) => ({ ...s, handoffSubState: "custom_path_input" }));
	} else {
		createSkillsInLocations([value]);
	}
}

async function handleCustomPathSubmit() {
	const state = currentState;
	const trimmedPath = state.customPathInput.trim();
	if (!trimmedPath) {
		app.update((s) => ({ ...s, handoffSubState: "next_steps" }));
		return;
	}
	await createSkillsInLocations([trimmedPath]);
}

async function createSkillsInLocations(locations: string[]) {
	app.update((s) => ({ ...s, handoffSubState: "creating_skills" }));

	const state = currentState;
	const allCreated: string[] = [];

	try {
		for (const location of locations) {
			const skillsPath = path.join(process.cwd(), location);
			const skillsToCreate = skills.filter((skill) => {
				if (skill.id === "autumn-pricing" && state.hasPricing) return false;
				return true;
			});
			for (const skill of skillsToCreate) {
				const skillDir = path.join(skillsPath, skill.id);
				await fs.mkdir(skillDir, { recursive: true });
				const skillFilePath = path.join(skillDir, "SKILL.md");
				await fs.writeFile(skillFilePath, skill.content, "utf-8");
				allCreated.push(`${skill.id}/SKILL.md`);
			}
		}

		app.update((s) => ({
			...s,
			createdSkillsDirs: locations,
			createdSkillsFiles: allCreated,
			handoffSubState: "next_steps",
		}));
	} catch {
		app.update((s) => ({ ...s, handoffSubState: "next_steps" }));
	}
}

async function handleNextStepChoice(value: string) {
	app.update((s) => ({ ...s, nextStepSelection: value, lastNextStepChoice: value }));

	if (value === "docs") {
		await open("https://docs.useautumn.com");
	} else if (value === "copy") {
		await clipboard.write(SYSTEM_PROMPT);
		app.update((s) => ({ ...s, clipboardFeedback: true }));
	}

	app.update((s) => ({ ...s, handoffSubState: "manual_exit" }));
	setTimeout(() => {
		app.stop();
		process.exit(0);
	}, 900);
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export async function createInitApp() {
	app = createNodeApp<InitState>({
		initialState: {
			currentStep: "auth",
			totalSteps: 3,
			monorepoInfo: null,
			targetPath: process.cwd(),
			hasPricing: false,
			hasCustomers: false,
			orgInfo: null,

			authSubState: "checking",
			authError: null,

			pathInput: "",
			pathState: "input",
			pathError: null,

			configSubState: "loading",
			configError: null,
			plansCount: 0,
			featuresCount: 0,
			hasExistingConfig: false,
			configMenuSelection: "template",
			postNukeMenuSelection: "template",
			completionAction: null,

			templateSelectedIndex: 0,

			pullIsLoading: false,
			pullIsSuccess: false,

			handoffSubState: "ai_choice",
			aiChoiceSelection: "yes",
			locationSelections: [".claude/skills"],
			customPathInput: "",
			createdSkillsDirs: [],
			createdSkillsFiles: [],
			nextStepSelection: "docs",
			lastNextStepChoice: "exit",
			clipboardFeedback: false,

			stripeState: "pending",
			stripeError: null,
		},
	});

	app.view((s) => { currentState = s; return renderInit(s); });

	app.keys({
		"ctrl+c": () => {
			app.stop();
			process.exit(0);
		},
		"enter": (ctx) => {
			const state = ctx.state;
			// Handle path input submit
			if (state.currentStep === "path" && state.pathState === "input") {
				handlePathSubmit();
				return;
			}
			// Handle template selection in config step
			if (state.configSubState === "template") {
				const selected = v2Templates[state.templateSelectedIndex];
				if (selected) {
					handleTemplateSelect(selected.name);
				}
				return;
			}
			// Handle custom path submit in handoff
			if (state.handoffSubState === "custom_path_input") {
				handleCustomPathSubmit();
				return;
			}
		},
		"escape": (ctx) => {
			const state = ctx.state;
			// Handle template selector cancel (go back to choosing)
			if (state.configSubState === "template") {
				if (state.completionAction === "nuke") {
					app.update((s) => ({ ...s, configSubState: "post_nuke_choice" }));
				} else {
					app.update((s) => ({ ...s, configSubState: "choosing" }));
				}
			}
		},
		"up": (ctx) => {
			const state = ctx.state;
			if (state.configSubState === "template") {
				app.update((s) => ({
					...s,
					templateSelectedIndex:
						s.templateSelectedIndex > 0
							? s.templateSelectedIndex - 1
							: v2Templates.length - 1,
				}));
			}
		},
		"down": (ctx) => {
			const state = ctx.state;
			if (state.configSubState === "template") {
				app.update((s) => ({
					...s,
					templateSelectedIndex:
						s.templateSelectedIndex < v2Templates.length - 1
							? s.templateSelectedIndex + 1
							: 0,
				}));
			}
		},
	});

	await app.start();

	// Start auth flow
	try {
		const apiKey = readFromEnv({ bypass: true });
		if (apiKey) {
			try {
				const info = await fetchOrganizationMe({ secretKey: apiKey });
				const orgInfo: OrgInfo = { name: info.name, slug: info.slug };
				app.update((s) => ({ ...s, authSubState: "authenticated", orgInfo }));
				handleAuthComplete(orgInfo);
			} catch {
				app.update((s) => ({ ...s, authSubState: "not_authenticated" }));
				await performAuth();
			}
		} else {
			app.update((s) => ({ ...s, authSubState: "not_authenticated" }));
			await performAuth();
		}
	} catch {
		app.update((s) => ({ ...s, authSubState: "not_authenticated" }));
		await performAuth();
	}
}

// ─── Headless init (non-TTY) ─────────────────────────────────────────────────

export async function headlessInit() {
	const DEFAULT_SKILLS_DIR = ".claude/skills";

	console.log("Checking authentication...");

	// Step 1: Auth
	let orgInfo: OrgInfo;
	try {
		const apiKey = readFromEnv({ bypass: true });
		if (apiKey) {
			try {
				const info = await fetchOrganizationMe({ secretKey: apiKey });
				orgInfo = { name: info.name, slug: info.slug };
			} catch {
				console.log("Existing key invalid, re-authenticating...");
				const { tokens } = await startOAuthFlow(CLI_CLIENT_ID, { headless: true });
				const { sandboxKey, prodKey } = await getApiKeysWithToken(tokens.access_token);
				await storeEnvKeys({ prodKey, sandboxKey }, { forceOverwrite: true });
				const info = await fetchOrganizationMe({ secretKey: sandboxKey });
				orgInfo = { name: info.name, slug: info.slug };
			}
		} else {
			const { tokens } = await startOAuthFlow(CLI_CLIENT_ID, { headless: true });
			const { sandboxKey, prodKey } = await getApiKeysWithToken(tokens.access_token);
			await storeEnvKeys({ prodKey, sandboxKey }, { forceOverwrite: true });
			const info = await fetchOrganizationMe({ secretKey: sandboxKey });
			orgInfo = { name: info.name, slug: info.slug };
		}
	} catch (err) {
		console.error(`✗ Authentication failed: ${err instanceof Error ? err.message : err}`);
		process.exit(1);
		return;
	}

	console.log(`✓ Logged in as ${orgInfo.name} (${orgInfo.slug})`);

	// Step 2: Check sandbox
	console.log("\nChecking your sandbox...");
	let plansCount = 0;
	let featuresCount = 0;
	try {
		const sandboxKey = getKey(AppEnv.Sandbox);
		const [features, plans] = await Promise.all([
			fetchFeatures({ secretKey: sandboxKey }),
			fetchPlans({ secretKey: sandboxKey }),
		]);
		plansCount = plans.length;
		featuresCount = features.length;

		if (plansCount > 0 || featuresCount > 0) {
			console.log(`✓ Found ${plansCount} plans, ${featuresCount} features`);
		} else {
			console.log("✓ Sandbox is empty");
		}
	} catch (err) {
		console.error(`✗ ${err instanceof Error ? err.message : "Failed to check configuration"}`);
		process.exit(1);
		return;
	}

	// Step 3: Sync
	const hasConfig = plansCount > 0 || featuresCount > 0;
	console.log(hasConfig ? "\nPulling configuration..." : "\nCreating empty config...");

	try {
		if (hasConfig) {
			const result = await pull({
				generateSdkTypes: true,
				cwd: process.cwd(),
				environment: AppEnv.Sandbox,
			});
			console.log(`✓ Pulled ${result.features.length} features, ${result.plans.length} plans`);
			if (result.sdkTypesPath) {
				console.log(`✓ Generated SDK types at: ${result.sdkTypesPath}`);
			}
		} else {
			writeEmptyConfig();
			console.log("✓ Created autumn.config.ts");
		}
	} catch (err) {
		console.error(`✗ ${err instanceof Error ? err.message : "Failed to sync configuration"}`);
		process.exit(1);
		return;
	}

	// Step 4: Skills
	console.log("\nCreating AI skills...");
	const hasPricing = plansCount > 0;
	const skillsPath = path.join(process.cwd(), DEFAULT_SKILLS_DIR);
	const filesCreated: string[] = [];

	try {
		const skillsToCreate = skills.filter((skill) => {
			return true; // saveAll mode in headless
		});

		for (const skill of skillsToCreate) {
			const skillDir = path.join(skillsPath, skill.id);
			await fs.mkdir(skillDir, { recursive: true });
			const skillFilePath = path.join(skillDir, "SKILL.md");
			await fs.writeFile(skillFilePath, skill.content, "utf-8");
			filesCreated.push(`${skill.id}/SKILL.md`);
		}

		console.log(`✓ Created ${DEFAULT_SKILLS_DIR}/`);
		for (let i = 0; i < filesCreated.length; i++) {
			const prefix = i === filesCreated.length - 1 ? "└──" : "├──";
			console.log(`  ${prefix} ${filesCreated[i]}`);
		}
	} catch (err) {
		console.error(`✗ Failed to create AI skills: ${err instanceof Error ? err.message : err}`);
		process.exit(1);
		return;
	}

	// Step 5: Complete
	const monorepoInfo = detectMonorepo();

	console.log("\nSetup complete!");
	console.log("\nNext steps:");
	console.log(`1. Skills in ${DEFAULT_SKILLS_DIR}/ are auto-detected by AI coding assistants`);
	console.log("2. Ask your AI assistant to help integrate Autumn billing");
	console.log("3. Run `atmn push` when ready to deploy changes to your sandbox");

	if (monorepoInfo.detected) {
		console.log(`\n⚠️  Monorepo detected (${monorepoInfo.reason})`);
		console.log("   Files were created in the root directory:");
		console.log("   - autumn.config.ts");
		console.log("   - @useautumn-sdk.d.ts");
		if (filesCreated.length > 0) {
			console.log(`   - ${DEFAULT_SKILLS_DIR}/`);
		}
		console.log("   You may want to move these to your preferred package location.");
	}

	console.log("\nDocumentation: https://docs.useautumn.com");
	console.log("Discord: https://discord.gg/atmn");
}
