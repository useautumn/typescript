/**
 * Rezi TUI app for the `atmn pull` command.
 * Progressive pull flow: loading → pulling → writing → complete
 */
import { ui, rgb, type VNode } from "@rezi-ui/core";
import { createNodeApp } from "@rezi-ui/node";
import { readFileSync } from "node:fs";
import { pull } from "../../../commands/pull/pull.js";
import type { Feature, Plan } from "../../../compose/models/index.js";
import { fetchOrganizationMe } from "../../../lib/api/endpoints/index.js";
import { formatError } from "../../../lib/api/client.js";
import { AppEnv, getKey } from "../../../lib/env/index.js";
import type { UpdateResult } from "../../../lib/transforms/inPlaceUpdate/index.js";
import { card, colors, loadingText, statusRow } from "../helpers.js";

interface GeneratedFile {
	name: string;
	path: string;
	lines: number;
}

interface OrgInfo {
	name: string;
	slug: string;
	environment: string;
}

interface PullState {
	orgInfo: OrgInfo | null;
	features: Feature[];
	plans: Plan[];
	files: GeneratedFile[];
	isOrgLoading: boolean;
	isPullLoading: boolean;
	isSuccess: boolean;
	error: string | null;
	inPlace: boolean;
	updateResult: UpdateResult | null;
	startTime: number;
}

function countLines(filePath: string): number {
	try {
		const content = readFileSync(filePath, "utf-8");
		return content.split("\n").length;
	} catch {
		return 0;
	}
}

function featureRow(feature: Feature): VNode {
	return ui.row({}, [
		ui.text("✓", { style: { fg: colors.green } }),
		ui.text(` ${feature.id} `),
		ui.text(feature.type, { style: { fg: colors.gray } }),
	]);
}

function planRow(plan: Plan): VNode {
	const featureCount = plan.items?.length || 0;
	return ui.row({}, [
		ui.text("✓", { style: { fg: colors.green } }),
		ui.text(` ${plan.name} `),
		ui.text(
			`${featureCount} ${featureCount === 1 ? "feature" : "features"}`,
			{ style: { fg: colors.gray } },
		),
	]);
}

function fileRow(file: GeneratedFile, done: boolean): VNode {
	return ui.row({}, [
		done
			? ui.text("✓", { style: { fg: colors.green } })
			: ui.spinner({ variant: "dots" }),
		ui.text(` ${file.name} `),
		ui.text(`${file.lines} lines`, { style: { fg: colors.gray } }),
	]);
}

function renderPull(s: PullState): VNode {
	if (s.error) {
		return ui.column({ px: 1 }, [
			ui.text("✗ Error pulling from Autumn", { style: { fg: colors.red, bold: true } }),
			ui.text(s.error, { style: { fg: colors.red } }),
		]);
	}

	const children: VNode[] = [];

	// Header
	children.push(card("🍂 Pulling from Autumn", []));

	// Organization Card
	if (s.isOrgLoading) {
		children.push(card("📦 Organization", [loadingText("Fetching...")]));
	} else if (s.orgInfo) {
		children.push(
			card("📦 Organization", [
				ui.row({ gap: 1 }, [ui.text("Name:", { style: { fg: colors.gray } }), ui.text(s.orgInfo.name)]),
				ui.row({ gap: 1 }, [ui.text("Environment:", { style: { fg: colors.gray } }), ui.text(s.orgInfo.environment)]),
			]),
		);
	}

	// Features Card
	if (!s.isOrgLoading) {
		const featTitle = `🎯 Features${s.features.length > 0 ? ` (${s.features.length})` : ""}`;
		const featChildren: VNode[] = [];
		if (s.isPullLoading && s.features.length === 0) {
			featChildren.push(loadingText("Fetching..."));
		} else if (s.features.length > 0) {
			for (const f of s.features.slice(0, 4)) {
				featChildren.push(featureRow(f));
			}
			if (s.features.length > 4) {
				featChildren.push(ui.text(`... ${s.features.length - 4} more`, { style: { fg: colors.gray } }));
			}
		}
		children.push(card(featTitle, featChildren));
	}

	// Plans Card
	if (!s.isOrgLoading) {
		const planTitle = `📋 Plans${s.plans.length > 0 ? ` (${s.plans.length})` : ""}`;
		const planChildren: VNode[] = [];
		if (s.isPullLoading && s.plans.length === 0) {
			planChildren.push(loadingText("Fetching..."));
		} else if (s.plans.length > 0) {
			for (const p of s.plans.slice(0, 4)) {
				planChildren.push(planRow(p));
			}
			if (s.plans.length > 4) {
				planChildren.push(ui.text(`... ${s.plans.length - 4} more`, { style: { fg: colors.gray } }));
			}
		}
		children.push(card(planTitle, planChildren));
	}

	// Generated Files Card
	if (!s.isOrgLoading) {
		const fileChildren: VNode[] = [];
		if (s.files.length > 0) {
			for (const f of s.files) {
				fileChildren.push(fileRow(f, s.isSuccess));
			}
		} else if (s.isPullLoading) {
			fileChildren.push(loadingText("Generating..."));
		}
		children.push(card("📝 Generated", fileChildren));
	}

	// Completion Message
	if (s.isSuccess) {
		const duration = ((Date.now() - s.startTime) / 1000).toFixed(1);
		const completeChildren: VNode[] = [
			ui.text(`✨ Done in ${duration}s`, { style: { fg: colors.green } }),
		];
		if (s.inPlace && s.updateResult) {
			completeChildren.push(
				ui.text(
					`In-place: ${s.updateResult.featuresUpdated} features updated, ${s.updateResult.featuresAdded} added, ${s.updateResult.featuresDeleted} deleted`,
					{ style: { fg: colors.cyan } },
				),
			);
			completeChildren.push(
				ui.text(
					`${s.updateResult.plansUpdated} plans updated, ${s.updateResult.plansAdded} added, ${s.updateResult.plansDeleted} deleted`,
					{ style: { fg: colors.cyan } },
				),
			);
		}
		children.push(ui.column({ mt: 1 }, completeChildren));
	}

	return ui.column({ mb: 1 }, children);
}

export async function createPullApp(opts: {
	environment?: AppEnv;
	forceOverwrite?: boolean;
	onComplete?: () => void;
	cwd?: string;
}) {
	const environment = opts.environment ?? AppEnv.Sandbox;
	const forceOverwrite = opts.forceOverwrite ?? false;
	const effectiveCwd = opts.cwd ?? process.cwd();

	const app = createNodeApp<PullState>({ config: { executionMode: "inline" },
		initialState: {
			orgInfo: null,
			features: [],
			plans: [],
			files: [],
			isOrgLoading: true,
			isPullLoading: false,
			isSuccess: false,
			error: null,
			inPlace: false,
			updateResult: null,
			startTime: Date.now(),
		},
	});

	app.view(renderPull);

	app.keys({
		"ctrl+c": () => {
			app.stop();
			process.exit(0);
		},
	});

	await app.start();

	// Step 1: Fetch org info
	try {
		const secretKey = getKey(environment, effectiveCwd);
		const orgData = await fetchOrganizationMe({ secretKey });
		app.update((s) => ({
			...s,
			orgInfo: {
				name: orgData.name,
				slug: orgData.slug,
				environment: environment === AppEnv.Sandbox ? "Sandbox" : "Live",
			},
			isOrgLoading: false,
			isPullLoading: true,
		}));
	} catch (e) {
		app.update((s) => ({
			...s,
			error: formatError(e),
			isOrgLoading: false,
		}));
		setTimeout(() => app.stop(), 1500);
		return;
	}

	// Step 2: Pull data
	try {
		const result = await pull({
			generateSdkTypes: true,
			cwd: effectiveCwd,
			environment,
			forceOverwrite,
		});

		const files: GeneratedFile[] = [];
		if (result.configPath) {
			files.push({
				name: "autumn.config.ts",
				path: result.configPath,
				lines: countLines(result.configPath),
			});
		}
		if (result.sdkTypesPath) {
			files.push({
				name: "@useautumn-sdk.d.ts",
				path: result.sdkTypesPath,
				lines: countLines(result.sdkTypesPath),
			});
		}

		app.update((s) => ({
			...s,
			features: result.features,
			plans: result.plans,
			files,
			isPullLoading: false,
			isSuccess: true,
			inPlace: result.inPlace ?? false,
			updateResult: result.updateResult ?? null,
		}));

		setTimeout(() => {
			app.stop();
			opts.onComplete?.();
		}, 1000);
	} catch (e) {
		app.update((s) => ({
			...s,
			error: formatError(e),
			isPullLoading: false,
		}));
		setTimeout(() => app.stop(), 1500);
	}
}
