/**
 * Nuke command — Rezi TUI implementation
 * Full nuke flow: warning → backup → confirm → deletion → success → explosion → summary
 */
import { ui, rgb, type VNode } from "@rezi-ui/core";
import { createNodeApp } from "@rezi-ui/node";
import { createConfigBackup } from "../../../commands/nuke/backup.js";
import {
	deleteCustomersBatch,
	deleteFeaturesBatch,
	deletePlansBatch,
} from "../../../commands/nuke/deletions.js";
import type { DeletionProgress, NukePhaseStats } from "../../../commands/nuke/types.js";
import {
	getMaxCustomers,
	NukeValidationError,
	validateCustomerLimit,
	validateSandboxOnly,
} from "../../../commands/nuke/validation.js";
import {
	type ApiCustomer,
	deleteCustomer,
	fetchCustomers,
} from "../../../lib/api/endpoints/customers.js";
import { deleteFeature, fetchFeatures } from "../../../lib/api/endpoints/features.js";
import { fetchOrganizationMe } from "../../../lib/api/endpoints/index.js";
import { deletePlan, fetchPlans } from "../../../lib/api/endpoints/plans.js";
import {
	getExplodeFrame,
	getExplosionColor,
} from "../../../lib/animation/explosion.js";
import { AppEnv } from "../../../lib/env/detect.js";
import { getKey } from "../../../lib/env/index.js";
import { card, colors, loadingText } from "../helpers.js";

// ── Types ──────────────────────────────────────────────────────────────────

type NukeScreen =
	| "loading"
	| "error"
	| "warning"
	| "backup"
	| "confirm"
	| "deleting"
	| "success"
	| "explosion"
	| "final";

interface NukeState {
	screen: NukeScreen;
	error: string | null;
	orgName: string;
	customersCount: number;
	plansCount: number;
	featuresCount: number;
	warningInput: string;
	backupChoice: string;
	backupCreated: boolean;
	confirmInput: string;
	confirmError: string | null;
	phases: NukePhaseStats[];
	activePhase: "customers" | "plans" | "features" | null;
	totalElapsed: number;
	explosionFrame: number;
	explosionMaxFrames: number;
	explosionImage: string;
	explosionColor: string;
}

type App = ReturnType<typeof createNodeApp<NukeState>>;

// ── Color mapping for explosion ────────────────────────────────────────────

const EXPLOSION_COLOR_MAP: Record<string, ReturnType<typeof rgb>> = {
	white: rgb(255, 255, 255),
	yellow: rgb(255, 255, 0),
	red: rgb(255, 80, 80),
	blue: rgb(80, 80, 255),
	blackBright: rgb(100, 100, 100),
};

// ── Initial phases ─────────────────────────────────────────────────────────

function initialPhases(): NukePhaseStats[] {
	return [
		{ phase: "customers", current: 0, total: 0, rate: 0, completed: false },
		{ phase: "plans", current: 0, total: 0, rate: 0, completed: false },
		{ phase: "features", current: 0, total: 0, rate: 0, completed: false },
	];
}

// ── Main Entry Point ───────────────────────────────────────────────────────

export async function createNukeApp(opts?: { onExit?: () => void }) {
	const onExit = opts?.onExit ?? (() => process.exit(0));

	// Pre-validate environment
	let initialScreen: NukeScreen = "loading";
	let initialError: string | null = null;

	try {
		const secretKey = getKey(AppEnv.Sandbox);
		validateSandboxOnly(secretKey);
	} catch (err) {
		initialScreen = "error";
		initialError = err instanceof NukeValidationError ? err.message : "Failed to validate environment";
	}

	const app = createNodeApp<NukeState>({
		initialState: {
			screen: initialScreen,
			error: initialError,
			orgName: "",
			customersCount: 0,
			plansCount: 0,
			featuresCount: 0,
			warningInput: "",
			backupChoice: "yes",
			backupCreated: false,
			confirmInput: "",
			confirmError: null,
			phases: initialPhases(),
			activePhase: null,
			totalElapsed: 0,
			explosionFrame: 0,
			explosionMaxFrames: 25,
			explosionImage: "",
			explosionColor: "white",
		},
	});

	// ── View ────────────────────────────────────────────────────────────
	app.view((s) => {
		switch (s.screen) {
			case "loading":
				return viewLoading();
			case "error":
				return viewError(s.error ?? "Unknown error");
			case "warning":
				return viewWarning(s, app, onExit);
			case "backup":
				return viewBackup(s, app);
			case "confirm":
				return viewConfirm(s, app, onExit);
			case "deleting":
				return viewDeletion(s);
			case "success":
				return viewSuccess(s);
			case "explosion":
				return viewExplosion(s);
			case "final":
				return viewFinal(s);
			default:
				return ui.text("");
		}
	});

	// ── Global Keys ─────────────────────────────────────────────────────
	app.keys({
		escape: (ctx) => {
			const s = ctx.state;
			if (s.screen === "warning" || s.screen === "confirm") {
				app.stop();
				onExit();
			}
		},
		"ctrl+c": (ctx) => {
			app.stop();
			onExit();
		},
		enter: (ctx) => {
			const s = ctx.state;
			if (s.screen === "confirm") {
				if (s.confirmInput === s.orgName) {
					app.update((prev) => ({ ...prev, screen: "deleting" as const, confirmError: null }));
					performNuke(app, onExit);
				} else {
					app.update((prev) => ({ ...prev, confirmError: `Incorrect. Expected "${prev.orgName}"` }));
					setTimeout(() => {
						app.update((prev) => ({ ...prev, confirmError: null }));
					}, 2000);
				}
			}
		},
	});

	// ── Start ───────────────────────────────────────────────────────────
	await app.start();

	// If we had a validation error, just show it briefly and exit
	if (initialScreen === "error") {
		setTimeout(() => {
			app.stop();
			onExit();
		}, 100);
		return app;
	}

	// Fetch nuke data
	await loadNukeData(app, onExit);

	return app;
}

// ── Data Loading ───────────────────────────────────────────────────────────

async function loadNukeData(app: App, onExit: () => void) {
	try {
		const secretKey = getKey(AppEnv.Sandbox);

		const [org, customers, plans, features] = await Promise.all([
			fetchOrganizationMe({ secretKey }),
			fetchCustomers({ secretKey }),
			fetchPlans({ secretKey, includeArchived: true }),
			fetchFeatures({ secretKey }),
		]);

		const maxCustomers = getMaxCustomers();
		validateCustomerLimit(customers.length, maxCustomers);

		app.update((s) => ({
			...s,
			screen: "warning" as const,
			orgName: org.name,
			customersCount: customers.length,
			plansCount: plans.length,
			featuresCount: features.length,
		}));
	} catch (err) {
		const msg = err instanceof NukeValidationError
			? err.message
			: err instanceof Error
				? err.message
				: "Failed to load data";
		app.update((s) => ({ ...s, screen: "error" as const, error: msg }));
		setTimeout(() => {
			app.stop();
			onExit();
		}, 100);
	}
}

// ── Nuke Execution ─────────────────────────────────────────────────────────

async function performNuke(app: App, onExit: () => void) {
	const nukeStart = Date.now();
	let elapsedInterval: ReturnType<typeof setInterval> | null = null;

	try {
		const secretKey = getKey(AppEnv.Sandbox);

		elapsedInterval = setInterval(() => {
			app.update((s) => ({
				...s,
				totalElapsed: (Date.now() - nukeStart) / 1000,
			}));
		}, 200);

		const updatePhase = (progress: DeletionProgress) => {
			app.update((s) => ({
				...s,
				totalElapsed: (Date.now() - nukeStart) / 1000,
				phases: s.phases.map((p) =>
					p.phase === progress.phase
						? { ...p, current: progress.current, total: progress.total, rate: progress.rate || 0 }
						: p,
				),
			}));
		};

		const completePhase = (phase: "customers" | "plans" | "features", duration: number) => {
			app.update((s) => ({
				...s,
				phases: s.phases.map((p) =>
					p.phase === phase ? { ...p, completed: true, duration } : p,
				),
			}));
		};

		// Phase 1: Customers
		const customersStart = Date.now();
		app.update((s) => ({ ...s, activePhase: "customers" as const }));

		const customers = await fetchCustomers({ secretKey });
		app.update((s) => ({
			...s,
			phases: s.phases.map((p) =>
				p.phase === "customers" ? { ...p, total: customers.length } : p,
			),
		}));

		await deleteCustomersBatch(
			customers.map((c: ApiCustomer) => ({ id: c.id })),
			async (id: string) => { await deleteCustomer({ secretKey, customerId: id }); },
			updatePhase,
		);
		completePhase("customers", (Date.now() - customersStart) / 1000);

		// Phase 2: Plans
		const plansStart = Date.now();
		app.update((s) => ({ ...s, activePhase: "plans" as const }));

		const plans = await fetchPlans({ secretKey, includeArchived: true });
		app.update((s) => ({
			...s,
			phases: s.phases.map((p) =>
				p.phase === "plans" ? { ...p, total: plans.length } : p,
			),
		}));

		await deletePlansBatch(
			plans.map((p) => ({ id: p.id })),
			async (id: string, allVersions: boolean) => { await deletePlan({ secretKey, planId: id, allVersions }); },
			updatePhase,
		);
		completePhase("plans", (Date.now() - plansStart) / 1000);

		// Wait for DB propagation
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Phase 3: Features
		const featuresStart = Date.now();
		app.update((s) => ({ ...s, activePhase: "features" as const }));

		const features = await fetchFeatures({ secretKey });
		app.update((s) => ({
			...s,
			phases: s.phases.map((p) =>
				p.phase === "features" ? { ...p, total: features.length } : p,
			),
		}));

		await deleteFeaturesBatch(
			features.map((f) => ({ id: f.id, type: f.type })),
			async (id: string) => { await deleteFeature({ secretKey, featureId: id }); },
			updatePhase,
		);
		completePhase("features", (Date.now() - featuresStart) / 1000);

		if (elapsedInterval) clearInterval(elapsedInterval);

		// Transition to success screen
		app.update((s) => ({ ...s, screen: "success" as const, activePhase: null }));

		// Auto-advance to explosion after 1.5s
		setTimeout(() => {
			app.update((s) => ({ ...s, screen: "explosion" as const }));
			runExplosionAnimation(app, onExit);
		}, 1500);
	} catch (err) {
		if (elapsedInterval) clearInterval(elapsedInterval);
		const msg = err instanceof Error ? err.message : "Nuke failed";
		app.update((s) => ({ ...s, screen: "error" as const, error: msg }));
	}
}

// ── Explosion Animation ────────────────────────────────────────────────────

function runExplosionAnimation(app: App, onExit: () => void) {
	const maxFrames = 25;
	const frameDuration = 16;
	const termWidth = process.stdout.columns || 80;
	const termHeight = process.stdout.rows || 24;
	const width = termWidth;
	const height = termHeight - 2;
	let frame = 0;

	const tick = () => {
		if (frame >= maxFrames) {
			setTimeout(() => {
				app.update((s) => ({ ...s, screen: "final" as const }));
				setTimeout(() => {
					app.stop();
					onExit();
				}, 2000);
			}, 500);
			return;
		}

		const image = getExplodeFrame(width, height, frame, maxFrames);
		const color = getExplosionColor(frame, maxFrames);

		app.update((s) => ({
			...s,
			explosionFrame: frame,
			explosionImage: image,
			explosionColor: color,
		}));

		frame++;
		setTimeout(tick, frameDuration);
	};

	tick();
}

// ── View Functions ─────────────────────────────────────────────────────────

function viewLoading(): VNode {
	return card("☢ Sandbox Nuke", [loadingText("Loading organization data...")]);
}

function viewError(error: string): VNode {
	return card("✗ Error", [
		ui.text(error, { style: { fg: colors.red } }),
	], { borderColor: colors.red });
}

function viewWarning(s: NukeState, app: App, onExit: () => void): VNode {
	return card("⚠  DANGER: SANDBOX NUKE", [
		ui.row({}, [
			ui.text("This is "),
			ui.text("IRREVERSIBLE", { style: { fg: colors.red, bold: true } }),
			ui.text("."),
		]),
		ui.text(""),
		ui.row({}, [
			ui.text("Organization: "),
			ui.text(s.orgName, { style: { bold: true } }),
			ui.text(" (sandbox)", { style: { dim: true } }),
		]),
		ui.text(""),
		ui.text("Items to be deleted:"),
		ui.text(`• ${s.customersCount} customers`),
		ui.text(`• ${s.plansCount} plans`),
		ui.text(`• ${s.featuresCount} features`),
		ui.text(""),
		ui.text("This action CANNOT be undone.", { style: { dim: true } }),
		ui.text(""),
		ui.row({}, [
			ui.text("Continue? "),
			ui.text("(y/N) ", { style: { bold: true } }),
			ui.text("> ", { style: { fg: colors.magenta } }),
			ui.input({
				id: "warning-input",
				value: s.warningInput,
				onInput: (value: string) => {
					const trimmed = value.trim().toLowerCase();
					if (trimmed.endsWith("y")) {
						app.update((prev) => ({ ...prev, screen: "backup" as const, warningInput: "" }));
					} else if (trimmed.endsWith("n")) {
						app.stop();
						onExit();
					} else {
						app.update((prev) => ({ ...prev, warningInput: value }));
					}
				},
			}),
		]),
	], { borderColor: colors.yellow });
}

function viewBackup(s: NukeState, app: App): VNode {
	return card("💾 Backup Configuration", [
		ui.text("Would you like to backup your config?"),
		ui.text("(Highly recommended)", { style: { dim: true } }),
		ui.text(""),
		ui.text("Backup location:", { style: { dim: true } }),
		ui.text("→ ./autumn.config.ts.backup", { style: { dim: true } }),
		ui.text(""),
		ui.select({
			id: "backup-select",
			value: s.backupChoice,
			options: [
				{ value: "yes", label: "Yes, create backup (recommended)" },
				{ value: "no", label: "No, skip backup" },
			],
			onChange: (value: string) => {
				const createBackup = value === "yes";
				let backupCreated = false;
				if (createBackup) {
					const result = createConfigBackup();
					if (result.created) {
						backupCreated = true;
					}
				}
				app.update((prev) => ({
					...prev,
					screen: "confirm" as const,
					backupChoice: value,
					backupCreated,
				}));
			},
		}),
		ui.text(""),
		ui.text("↑↓ Navigate • Enter to select", { style: { dim: true } }),
	]);
}

function viewConfirm(s: NukeState, app: App, onExit: () => void): VNode {
	const children: VNode[] = [
		ui.text("This is your LAST CHANCE to abort.", { style: { fg: colors.red, bold: true } }),
		ui.text(""),
		ui.text("You are about to delete:"),
		ui.text(`• ${s.customersCount} customers`),
		ui.text(`• ${s.plansCount} plans`),
		ui.text(`• ${s.featuresCount} features`),
		ui.text(""),
		ui.row({}, [
			ui.text("From organization: "),
			ui.text(s.orgName, { style: { bold: true } }),
			ui.text(" (sandbox)", { style: { dim: true } }),
		]),
		ui.text(""),
		ui.text("Type your organization name to confirm:"),
		ui.row({}, [
			ui.text("> ", { style: { fg: colors.magenta } }),
			ui.input({
				id: "confirm-input",
				value: s.confirmInput,
				onInput: (value: string) => {
					app.update((prev) => ({ ...prev, confirmInput: value, confirmError: null }));
				},
			}),
		]),
	];

	if (s.confirmError) {
		children.push(ui.text(""));
		children.push(ui.text(s.confirmError, { style: { fg: colors.red } }));
	}

	children.push(ui.text(""));
	children.push(ui.text("Esc to cancel • Enter to confirm", { style: { dim: true } }));

	return card("🔥 FINAL CONFIRMATION", children, { borderColor: colors.red });
}

function viewDeletion(s: NukeState): VNode {
	const phaseNodes: VNode[] = s.phases.map((phase, index) => {
		if (phase.completed) {
			return ui.row({ key: phase.phase }, [
				ui.text(`${index + 1}. ${capitalize(phase.phase)} `),
				ui.text("✓ Complete", { style: { fg: colors.green } }),
				ui.text(` (${phase.total}) - ${phase.duration?.toFixed(1)}s`),
			]);
		}

		if (phase.phase === s.activePhase) {
			const percentage = phase.total > 0 ? Math.round((phase.current / phase.total) * 100) : 0;
			const progressValue = phase.total > 0 ? phase.current / phase.total : 0;
			const sparkline = generateSparkline(phase.rate);

			return ui.column({ key: phase.phase, gap: 0 }, [
				ui.row({}, [
					ui.text(`${index + 1}. ${capitalize(phase.phase)} `),
					ui.progress(progressValue, {
						width: 20,
						variant: "bar",
						style: { fg: colors.magenta },
					}),
					ui.text(` ${phase.current}/${phase.total} (${percentage}%)`),
				]),
				...(phase.rate > 0
					? [ui.text(`   ${sparkline}`, { style: { fg: colors.magenta } })]
					: []),
			]);
		}

		return ui.text(
			`${index + 1}. ${capitalize(phase.phase)} ⏳ Waiting... (${phase.total} items)`,
			{ key: phase.phase, style: { dim: true } },
		);
	});

	return card("☢ Nuke Process", [
		...phaseNodes,
		ui.text(""),
		ui.text(`Elapsed: ${s.totalElapsed.toFixed(1)}s`, { style: { dim: true } }),
	]);
}

function viewSuccess(s: NukeState): VNode {
	const children: VNode[] = [
		ui.text(`✓ ${s.customersCount} customers deleted`, { style: { fg: colors.green } }),
		ui.text(`✓ ${s.plansCount} plans deleted`, { style: { fg: colors.green } }),
		ui.text(`✓ ${s.featuresCount} features deleted`, { style: { fg: colors.green } }),
		ui.text(""),
	];

	if (s.backupCreated) {
		children.push(ui.text("Backup saved to autumn.config.ts.backup", { style: { dim: true } }));
		children.push(ui.text(""));
	}

	children.push(ui.text("Your sandbox is now empty.", { style: { bold: true } }));

	return card("☢ Nuke Complete", children);
}

function viewExplosion(s: NukeState): VNode {
	const fg = EXPLOSION_COLOR_MAP[s.explosionColor] ?? rgb(255, 255, 255);
	return ui.column({}, [
		ui.text(s.explosionImage, { style: { fg } }),
	]);
}

function viewFinal(s: NukeState): VNode {
	const children: VNode[] = [
		ui.text(`✓ ${s.customersCount} customers deleted`, { style: { fg: colors.green } }),
		ui.text(`✓ ${s.plansCount} plans deleted`, { style: { fg: colors.green } }),
		ui.text(`✓ ${s.featuresCount} features deleted`, { style: { fg: colors.green } }),
		ui.text(""),
	];

	if (s.backupCreated) {
		children.push(ui.text("Backup saved to autumn.config.ts.backup", { style: { dim: true } }));
		children.push(ui.text(""));
	}

	children.push(ui.text("Your sandbox is now empty.", { style: { fg: colors.magenta, bold: true } }));
	children.push(ui.text("Ready for a fresh start!", { style: { dim: true } }));

	return card("✨ Nuke Complete", children);
}

// ── Utilities ──────────────────────────────────────────────────────────────

function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateSparkline(rate: number): string {
	const chars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
	const normalized = Math.min(Math.floor(rate / 2), chars.length - 1);
	const char = chars[normalized] || "▁";
	return char.repeat(10);
}
