/**
 * Rezi TUI app for template selection.
 * Supports both v1 (horizontal card picker) and v2 (expandable vertical list) template selectors.
 */
import { ui, rgb, type VNode } from "@rezi-ui/core";
import { createNodeApp } from "@rezi-ui/node";
import {
	templates as v2Templates,
	type Template,
	type TemplateTier,
	type TemplateCreditCost,
	type TemplateBadge,
} from "../../../views/react/template2/data.js";
import { colors } from "../helpers.js";

// ─── Color rotation for plan cards ───────────────────────────────────────────
const PLAN_COLORS = [colors.yellow, colors.green, colors.cyan, colors.magenta] as const;

// ─── Badge color mapping ─────────────────────────────────────────────────────
const BADGE_COLORS: Record<string, ReturnType<typeof rgb>> = {
	cyan: colors.cyan,
	yellow: colors.yellow,
	green: colors.green,
	blue: rgb(80, 140, 255),
	gray: colors.gray,
	magenta: colors.magenta,
};

// ─── Width calculators ───────────────────────────────────────────────────────
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

// ─── State ───────────────────────────────────────────────────────────────────
interface TemplateState {
	selectedIndex: number;
	globalTierWidth: number;
	globalCreditSchemaWidth: number;
}

// ─── Sub-renderers ───────────────────────────────────────────────────────────
function renderBadge(badge: TemplateBadge, key: string): VNode {
	const fg = BADGE_COLORS[badge.color] ?? colors.gray;
	return ui.text(` ${badge.label} `, { key, style: { fg: colors.white, bold: true, bg: fg } });
}

function renderPlanCard(tier: TemplateTier, index: number, width: number): VNode {
	const titleColor = PLAN_COLORS[index % PLAN_COLORS.length];

	const featureNodes: VNode[] = tier.features.map((f, i) =>
		ui.text(`• ${f}`, { key: `f-${i}`, style: { dim: true } }),
	);

	return ui.box({ border: "rounded", px: 1, width }, [
		ui.row({ gap: 1 }, [
			ui.text(tier.name, { style: { fg: titleColor, bold: true } }),
			ui.text(tier.price, { style: { fg: colors.green } }),
		]),
		ui.column({}, featureNodes),
	]);
}

function renderCreditSchema(costs: TemplateCreditCost[], height: number, width: number): VNode {
	const rows: VNode[] = costs.map((cost) =>
		ui.row({ key: cost.action, gap: 2 }, [
			ui.text(cost.action, { style: { dim: true } }),
			ui.text(cost.credits, { style: { fg: colors.yellow } }),
		]),
	);

	return ui.box({ border: "rounded", px: 1, width, height }, [
		ui.text("Credit Costs", { style: { fg: colors.cyan, bold: true } }),
		ui.column({}, rows),
	]);
}

function renderTemplateRow(
	template: Template,
	isSelected: boolean,
	globalTierWidth: number,
	globalCreditSchemaWidth: number,
): VNode {
	const indicator = isSelected
		? ui.text("●", { style: { fg: colors.cyan, bold: true } })
		: ui.text("○", { style: { dim: true } });

	const headerParts: VNode[] = [
		indicator,
		ui.text(template.name, {
			style: { fg: isSelected ? colors.cyan : colors.white, bold: isSelected },
		}),
	];

	for (let i = 0; i < template.badges.length; i++) {
		headerParts.push(renderBadge(template.badges[i], `badge-${template.id}-${i}`));
	}

	const header = ui.row({ gap: 1 }, headerParts);

	if (!isSelected) {
		return ui.column({}, [header]);
	}

	// Expanded view
	const expandedChildren: VNode[] = [
		ui.text(template.description, { style: { dim: true } }),
	];

	// Tier cards
	const tierCards: VNode[] = template.tiers.map((tier, i) =>
		renderPlanCard(tier, i, globalTierWidth),
	);
	const tierColumn = ui.column({}, tierCards);

	// Calculate tiers height for credit schema
	let tiersHeight = 0;
	for (const tier of template.tiers) {
		tiersHeight += 2 + 1 + tier.features.length;
	}

	const hasCreditSystem =
		template.creditSystem && template.creditSystem.costs.length > 0;

	const cardsRow: VNode[] = [tierColumn];
	if (hasCreditSystem) {
		cardsRow.push(
			renderCreditSchema(
				template.creditSystem!.costs,
				tiersHeight,
				globalCreditSchemaWidth,
			),
		);
	}

	expandedChildren.push(ui.row({ mt: 1, gap: 1 }, cardsRow));
	expandedChildren.push(
		ui.row({ mt: 1 }, [
			ui.text("Press ", { style: { dim: true } }),
			ui.text("Enter", { style: { bold: true } }),
			ui.text(" to use this template", { style: { dim: true } }),
		]),
	);

	return ui.column({}, [
		header,
		ui.box({ ml: 1, border: "single", pl: 1 }, [
			ui.column({}, expandedChildren),
		]),
	]);
}

// ─── Main render ─────────────────────────────────────────────────────────────
function renderTemplate(s: TemplateState): VNode {
	const children: VNode[] = [];

	// Header
	children.push(
		ui.row({ gap: 1 }, [
			ui.text("◆", { style: { fg: colors.yellow } }),
			ui.text("Select a pricing template to start with:", { style: { bold: true } }),
		]),
	);

	// Instructions
	children.push(
		ui.text("Press ↑↓ to navigate, Enter to select", {
			style: { dim: true },
		}),
	);

	// Template list
	for (let i = 0; i < v2Templates.length; i++) {
		children.push(
			renderTemplateRow(
				v2Templates[i],
				i === s.selectedIndex,
				s.globalTierWidth,
				s.globalCreditSchemaWidth,
			),
		);
	}

	// Footer
	children.push(ui.text("Esc to cancel", { style: { dim: true } }));

	return ui.column({ px: 1, py: 1 }, children);
}

export async function createTemplateApp(opts?: {
	onSelect?: (templateName: string) => void;
	onCancel?: () => void;
}) {
	// Precalculate global widths
	let maxTierWidth = 0;
	let maxCreditSchemaWidth = 0;

	for (const template of v2Templates) {
		for (const tier of template.tiers) {
			const width = calculatePlanWidth(tier);
			if (width > maxTierWidth) maxTierWidth = width;
		}
		if (template.creditSystem?.costs) {
			const width = calculateCreditSchemaWidth(template.creditSystem.costs);
			if (width > maxCreditSchemaWidth) maxCreditSchemaWidth = width;
		}
	}

	const app = createNodeApp<TemplateState>({
		initialState: {
			selectedIndex: 0,
			globalTierWidth: maxTierWidth,
			globalCreditSchemaWidth: maxCreditSchemaWidth,
		},
	});

	app.view(renderTemplate);

	app.keys({
		"up": () =>
			app.update((s) => ({
				...s,
				selectedIndex:
					s.selectedIndex > 0 ? s.selectedIndex - 1 : v2Templates.length - 1,
			})),
		"down": () =>
			app.update((s) => ({
				...s,
				selectedIndex:
					s.selectedIndex < v2Templates.length - 1 ? s.selectedIndex + 1 : 0,
			})),
		"enter": (ctx) => {
			const state = ctx.state;
			const selected = v2Templates[state.selectedIndex];
			if (selected) {
				app.stop();
				opts?.onSelect?.(selected.name);
			}
		},
		"escape": () => {
			app.stop();
			opts?.onCancel?.();
		},
		"ctrl+c": () => {
			app.stop();
			process.exit(0);
		},
	});

	await app.start();
}
