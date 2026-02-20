/**
 * Rezi TUI app for the `atmn preview` command.
 * Loads config, renders plan preview cards with features and pricing.
 */
import { ui, rgb, type VNode } from "@rezi-ui/core";
import { createNodeApp } from "@rezi-ui/node";
import { loadConfig } from "../../../commands/preview/loadConfig.js";
import {
	getPlanPreview,
	type PlanPreview,
	type PlanFeatureDisplay,
} from "../../../commands/preview/previewPlan.js";
import { colors, card } from "../helpers.js";

interface PreviewState {
	previews: PlanPreview[];
	sharedWidth: number;
	error: string | null;
	loading: boolean;
}

const MIN_CARD_WIDTH = 40;
const BORDER_PADDING_OVERHEAD = 6;

function calculatePlanPreviewWidth(preview: PlanPreview): number {
	let maxWidth = preview.name.length;

	if (preview.basePrice && preview.freeTrial) {
		const combinedWidth = preview.basePrice.length + 3 + preview.freeTrial.length;
		maxWidth = Math.max(maxWidth, combinedWidth);
	} else {
		if (preview.basePrice) {
			maxWidth = Math.max(maxWidth, preview.basePrice.length);
		}
		if (preview.freeTrial) {
			maxWidth = Math.max(maxWidth, preview.freeTrial.length);
		}
	}

	for (const feature of preview.features) {
		const featureLineWidth = 3 + feature.primary_text.length;
		maxWidth = Math.max(maxWidth, featureLineWidth);

		if (feature.secondary_text) {
			const secondaryWidth = 3 + feature.secondary_text.length;
			maxWidth = Math.max(maxWidth, secondaryWidth);
		}

		if (feature.tier_details) {
			for (const tier of feature.tier_details) {
				const tierWidth = 6 + tier.length;
				maxWidth = Math.max(maxWidth, tierWidth);
			}
		}
	}

	return maxWidth + BORDER_PADDING_OVERHEAD;
}

function renderPlanCard(preview: PlanPreview, width: number): VNode {
	const children: VNode[] = [];

	// Base price and/or free trial
	if (preview.basePrice || preview.freeTrial) {
		const parts: VNode[] = [];
		if (preview.basePrice) {
			parts.push(ui.text(preview.basePrice, { style: { fg: colors.green, bold: true } }));
		}
		if (preview.basePrice && preview.freeTrial) {
			parts.push(ui.text(" · ", { style: { dim: true } }));
		}
		if (preview.freeTrial) {
			parts.push(ui.text(preview.freeTrial, { style: { fg: colors.cyan } }));
		}
		children.push(ui.row({}, parts));
	}

	// Features with tree-style formatting
	const featureCount = preview.features.length;
	if (featureCount > 0) {
		for (let i = 0; i < featureCount; i++) {
			const feature = preview.features[i];
			const isLastFeature = i === featureCount - 1;
			const featurePrefix = isLastFeature ? "└─" : "├─";
			const continuationPrefix = isLastFeature ? "   " : "│  ";

			// Primary feature text
			children.push(
				ui.row({}, [
					ui.text(featurePrefix, { style: { dim: true } }),
					ui.text(` ${feature.primary_text}`),
				]),
			);

			// Secondary text
			if (feature.secondary_text) {
				children.push(
					ui.row({}, [
						ui.text(continuationPrefix, { style: { dim: true } }),
						ui.text(feature.secondary_text),
					]),
				);
			}

			// Tier details
			if (feature.tier_details && feature.tier_details.length > 0) {
				for (let j = 0; j < feature.tier_details.length; j++) {
					const tierDetail = feature.tier_details[j];
					const isLastTier = j === feature.tier_details.length - 1;
					const tierPrefix = isLastTier ? "└─" : "├─";

					children.push(
						ui.row({}, [
							ui.text(continuationPrefix, { style: { dim: true } }),
							ui.text(tierPrefix, { style: { dim: true } }),
							ui.text(` ${tierDetail}`),
						]),
					);
				}
			}
		}
	}

	return ui.box(
		{
			border: "rounded",
			px: 1,
			width,
		},
		[
			ui.text(preview.name, { style: { fg: colors.magenta, bold: true } }),
			...(children.length > 0 ? [ui.column({ mt: 0 }, children)] : []),
		],
	);
}

function renderPreview(s: PreviewState): VNode {
	if (s.loading) {
		return ui.column({}, [ui.spinner({ variant: "dots", label: "Loading config..." })]);
	}

	if (s.error) {
		return ui.column({ px: 1 }, [
			ui.text("Error", { style: { fg: colors.red, bold: true } }),
			ui.text(s.error, { style: { fg: colors.red } }),
		]);
	}

	if (s.previews.length === 0) {
		return ui.text("No plans found.", { style: { dim: true } });
	}

	const cards: VNode[] = [];
	for (const preview of s.previews) {
		cards.push(renderPlanCard(preview, s.sharedWidth));
	}

	return ui.column({ gap: 1 }, cards);
}

export async function createPreviewApp(opts: {
	planId?: string;
	currency?: string;
	cwd?: string;
}) {
	const currency = opts.currency ?? "USD";
	const cwd = opts.cwd ?? process.cwd();

	const app = createNodeApp<PreviewState>({
		initialState: {
			previews: [],
			sharedWidth: MIN_CARD_WIDTH,
			error: null,
			loading: true,
		},
	});

	app.view(renderPreview);

	app.keys({
		"q": () => {
			app.stop();
			process.exit(0);
		},
		"ctrl+c": () => {
			app.stop();
			process.exit(0);
		},
	});

	await app.start();

	// Load config and generate previews
	try {
		const config = await loadConfig({ cwd });
		const { plans, features } = config;

		if (!plans || plans.length === 0) {
			app.update((s) => ({
				...s,
				loading: false,
				error: "No plans found in autumn.config.ts",
			}));
			return;
		}

		let plansToPreview = plans;
		if (opts.planId) {
			plansToPreview = plans.filter((p) => p.id === opts.planId);
			if (plansToPreview.length === 0) {
				app.update((s) => ({
					...s,
					loading: false,
					error: `Plan not found: ${opts.planId}\nAvailable plans: ${plans.map((p) => p.id).join(", ")}`,
				}));
				return;
			}
		}

		const previews = plansToPreview.map((plan) =>
			getPlanPreview({ plan, features, currency }),
		);

		let maxWidth = MIN_CARD_WIDTH;
		for (const preview of previews) {
			const width = calculatePlanPreviewWidth(preview);
			if (width > maxWidth) {
				maxWidth = width;
			}
		}

		app.update((s) => ({
			...s,
			previews,
			sharedWidth: maxWidth,
			loading: false,
		}));
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		app.update((s) => ({
			...s,
			loading: false,
			error: message,
		}));
	}
}
