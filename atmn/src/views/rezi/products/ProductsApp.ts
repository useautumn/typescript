/**
 * Products Rezi TUI App — migrated from React Ink ProductsView
 */
import { ui, rgb, type VNode } from "@rezi-ui/core";
import { createNodeApp } from "@rezi-ui/node";
import clipboardy from "clipboardy";
import open from "open";
import { fetchPlans } from "../../../lib/api/endpoints/plans.js";
import type { ApiPlan } from "../../../lib/api/types/index.js";
import { AppEnv } from "../../../lib/env/detect.js";
import { getKey } from "../../../lib/env/keys.js";
import { APP_VERSION } from "../../../lib/version.js";
import {
	titleBar,
	bottomBar,
	loadingText,
	errorView,
	emptyView,
	keyValue,
	colors,
	formatDate,
} from "../helpers.js";

const AUTUMN_DASHBOARD_URL = "https://app.useautumn.com";
const PAGE_SIZE = 50;

type FocusTarget = "table" | "sheet" | "search";

// ── Search helper ──────────────────────────────────────────────

function planSearchFn(p: ApiPlan, query: string): boolean {
	const q = query.toLowerCase();
	return (
		p.id.toLowerCase().includes(q) ||
		p.name.toLowerCase().includes(q) ||
		(p.description?.toLowerCase().includes(q) ?? false) ||
		(p.group?.toLowerCase().includes(q) ?? false)
	);
}

function paginate<T>(items: T[], page: number, pageSize: number, searchQuery: string, searchFn?: (item: T, q: string) => boolean) {
	let filtered = items;
	if (searchQuery.trim() && searchFn) {
		filtered = items.filter(i => searchFn(i, searchQuery.trim()));
	}
	const totalItems = filtered.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const clampedPage = Math.min(Math.max(1, page), totalPages);
	const start = (clampedPage - 1) * pageSize;
	const pageItems = filtered.slice(start, start + pageSize);
	return { pageItems, page: clampedPage, totalPages, totalItems, hasMore: clampedPage < totalPages, hasPrev: clampedPage > 1 };
}

// ── State ──────────────────────────────────────────────────────

interface ProductsState {
	allPlans: ApiPlan[];
	loading: boolean;
	error: string | null;
	page: number;
	selectedIndex: number;
	selectedItem: ApiPlan | null;
	focusTarget: FocusTarget;
	sheetOpen: boolean;
	searchQuery: string;
	searchOpen: boolean;
	searchInput: string;
	copiedFeedback: boolean;
}

// ── App ────────────────────────────────────────────────────────

export interface CreateProductsAppOptions {
	environment?: AppEnv;
	onExit: () => void;
}

export async function createProductsApp(opts: CreateProductsAppOptions) {
	const env = opts.environment ?? AppEnv.Sandbox;

	const app = createNodeApp<ProductsState>({ config: { executionMode: "inline" },
		initialState: {
			allPlans: [],
			loading: true,
			error: null,
			page: 1,
			selectedIndex: 0,
			selectedItem: null,
			focusTarget: "table",
			sheetOpen: false,
			searchQuery: "",
			searchOpen: false,
			searchInput: "",
			copiedFeedback: false,
		},
	});

	// ── Data fetching ──────────────────────────────────────────

	async function loadPlans() {
		app.update(st => ({ ...st, loading: true, error: null }));
		try {
			const secretKey = getKey(env);
			const list = await fetchPlans({ secretKey, includeArchived: true });
			app.update(st => {
				const pg = paginate(list, st.page, PAGE_SIZE, st.searchQuery, planSearchFn);
				const sel = pg.pageItems[st.selectedIndex] ?? pg.pageItems[0] ?? null;
				return { ...st, allPlans: list, loading: false, selectedItem: sel, selectedIndex: Math.min(st.selectedIndex, Math.max(0, pg.pageItems.length - 1)) };
			});
		} catch (e) {
			app.update(st => ({ ...st, error: e instanceof Error ? e.message : String(e), loading: false }));
		}
	}

	// ── Computed ────────────────────────────────────────────────

	function getPageData(s: ProductsState) {
		return paginate(s.allPlans, s.page, PAGE_SIZE, s.searchQuery, planSearchFn);
	}

	// ── View ───────────────────────────────────────────────────

	app.view((s) => {
		const pg = getPageData(s);
		const plans = pg.pageItems;

		const pagText = pg.totalItems > 0
			? `${(pg.page - 1) * PAGE_SIZE + 1}-${Math.min(pg.page * PAGE_SIZE, pg.totalItems)} of ${pg.totalItems}`
			: "";

		const top = titleBar({ commandName: "atmn products", version: APP_VERSION, paginationText: pagText, searchQuery: s.searchQuery || undefined });

		const hints = buildHints(s, pg.hasPrev, pg.hasMore);
		const bot = bottomBar(hints);

		// Loading
		if (s.loading && s.allPlans.length === 0) {
			return ui.column({}, [top, loadingText(`Loading ${env === AppEnv.Live ? "live" : "sandbox"} products...`), bot]);
		}
		// Error
		if (s.error && s.allPlans.length === 0) {
			return ui.column({}, [top, errorView(s.error, { onRetry: true }), bot]);
		}
		// Empty
		if (plans.length === 0 && !s.loading) {
			const title = s.searchQuery ? `No results for "${s.searchQuery}"` : "No products found";
			const desc = s.searchQuery ? "Press 'x' to clear search" : "Create products via the API or Autumn dashboard";
			return ui.column({}, [top, emptyView(title, desc, s.searchQuery || undefined), bot]);
		}

		// Search input overlay
		const searchRow = s.searchOpen
			? ui.box({ border: "rounded", px: 1 }, [
				ui.row({}, [
					ui.text("Search: ", { style: { fg: colors.magenta } }),
					ui.input({ id: "product-search", value: s.searchInput, onInput: (v: string) => app.update(st => ({ ...st, searchInput: v })) }),
				]),
			])
			: null;

		// Table
		const tableData = plans.map((p: ApiPlan) => ({
			id: p.id,
			name: p.name,
			version: `v${p.version}`,
			type: p.add_on ? "Add-on" : p.auto_enable ? "Default" : "Plan",
			price: !p.price ? "Free" : `$${(p.price.amount / 100).toFixed(2)}/${p.price.interval}`,
			features: String(p.items.length),
			created_at: formatDate(p.created_at),
		}));
		const table = ui.table({
			id: "products-table",
			columns: [
				{ key: "id", header: "ID", flex: 1 },
				{ key: "name", header: "Name", flex: 1 },
				{ key: "version", header: "Ver", width: 6 },
				{ key: "type", header: "Type", width: 9 },
				{ key: "price", header: "Price", width: 14 },
				{ key: "features", header: "Features", width: 10 },
				{ key: "created_at", header: "Created", width: 14 },
			],
			data: tableData,
			getRowKey: (row) => row.id,
			selection: s.selectedItem ? [s.selectedItem.id] : [],
			selectionMode: "single",
			onSelectionChange: (keys: string[]) => {
				const idx = plans.findIndex(p => p.id === keys[0]);
				if (idx >= 0) app.update(st => ({ ...st, selectedIndex: idx, selectedItem: plans[idx] }));
			},
			onRowPress: (_row, idx: number) => {
				const plan = plans[idx];
				if (plan) app.update(st => ({ ...st, selectedIndex: idx, selectedItem: plan, sheetOpen: true, focusTarget: "sheet" }));
			},
		});

		// Side panel
		let sidePanel: VNode | null = null;
		if (s.sheetOpen && s.selectedItem) {
			sidePanel = renderProductSheet(s);
		}

		const body = sidePanel
			? ui.row({ flex: 1 }, [ui.column({ flex: 1 }, [table]), ui.column({ width: 44 }, [sidePanel])])
			: table;

		const parts: VNode[] = [top];
		if (searchRow) parts.push(searchRow);
		parts.push(body, bot);
		return ui.column({}, parts);
	});

	// ── Render helpers ─────────────────────────────────────────

	function renderProductSheet(s: ProductsState): VNode {
		const p = s.selectedItem!;
		const planType = p.add_on ? "Add-on" : p.auto_enable ? "Default" : "Plan";

		const children: VNode[] = [
			ui.text(p.name, { style: { bold: true } }),
			ui.text(""),
			ui.text("Basic Info", { style: { fg: colors.magenta, bold: true } }),
			keyValue("ID", p.id),
			keyValue("Name", p.name),
		];

		if (p.description) children.push(keyValue("Description", p.description));
		if (p.group) children.push(keyValue("Group", p.group));

		children.push(keyValue("Version", `v${p.version}`));
		children.push(keyValue("Type", planType));
		children.push(ui.row({ gap: 1 }, [
			ui.text("Env:", { style: { fg: colors.gray } }),
			ui.text(p.env, { style: { fg: p.env === "live" ? colors.green : colors.yellow } }),
		]));
		children.push(ui.row({ gap: 1 }, [
			ui.text("Status:", { style: { fg: colors.gray } }),
			ui.text(p.archived ? "Archived" : "Active", { style: { fg: p.archived ? colors.red : colors.green } }),
		]));
		children.push(keyValue("Created", formatDate(p.created_at)));

		// Price
		children.push(ui.text(""), ui.text("Price", { style: { fg: colors.magenta, bold: true } }));
		if (p.price) {
			children.push(ui.row({ gap: 1 }, [ui.text("Amount:", { style: { fg: colors.gray } }), ui.text(`$${p.price.amount.toFixed(2)}`, { style: { fg: colors.green } })]));
			children.push(keyValue("Interval", `${p.price.interval}${p.price.interval_count && p.price.interval_count > 1 ? ` (every ${p.price.interval_count})` : ""}`));
		} else {
			children.push(ui.text("Free", { style: { fg: colors.cyan } }));
		}

		// Free trial
		if (p.free_trial) {
			children.push(ui.text(""), ui.text("Free Trial", { style: { fg: colors.magenta, bold: true } }));
			children.push(keyValue("Duration Type", p.free_trial.duration_type));
			children.push(keyValue("Duration Length", String(p.free_trial.duration_length)));
			children.push(ui.row({ gap: 1 }, [
				ui.text("Card Required:", { style: { fg: colors.gray } }),
				ui.text(p.free_trial.card_required ? "Yes" : "No", { style: { fg: p.free_trial.card_required ? colors.yellow : colors.green } }),
			]));
		}

		// Items
		children.push(ui.text(""), ui.text(`Items (${p.items.length})`, { style: { fg: colors.magenta, bold: true } }));
		if (p.items.length === 0) {
			children.push(ui.text("No items", { style: { fg: colors.gray } }));
		} else {
			const shown = p.items.slice(0, 10);
			shown.forEach((item, i) => {
				children.push(ui.row({}, [ui.text(`${i + 1}. `, { style: { fg: colors.gray } }), ui.text(item.feature_id, { style: { bold: true } })]));
				// Balance
				const balText = item.unlimited ? "Unlimited" : String(item.included ?? 0);
				children.push(ui.row({ gap: 1 }, [ui.text("   Balance:", { style: { fg: colors.gray } }), ui.text(balText, { style: { fg: item.unlimited ? colors.cyan : undefined } })]));
				// Reset
				if (item.reset) {
					children.push(ui.row({ gap: 1 }, [
						ui.text("   Reset:", { style: { fg: colors.gray } }),
						ui.text(`${item.reset.interval}${item.reset.interval_count && item.reset.interval_count > 1 ? ` (every ${item.reset.interval_count})` : ""}`),
					]));
				}
				// Usage price
				if (item.price) {
					const amt = item.price.amount !== undefined ? `$${item.price.amount.toFixed(2)}` : "Tiered";
					children.push(ui.row({ gap: 1 }, [
						ui.text("   Usage Price:", { style: { fg: colors.gray } }),
						ui.text(`${amt}/${item.price.interval}`, { style: { fg: colors.green } }),
					]));
				}
			});
			if (p.items.length > 10) {
				children.push(ui.text(`... and ${p.items.length - 10} more`, { style: { dim: true } }));
			}
		}

		// Actions
		children.push(ui.text(""));
		if (s.copiedFeedback) {
			children.push(ui.text("Copied!", { style: { fg: colors.green } }));
		} else {
			children.push(ui.row({}, [ui.text("[c]", { style: { fg: colors.magenta } }), ui.text(" Copy ID", { style: { fg: colors.gray } })]));
		}
		children.push(ui.row({}, [ui.text("[o]", { style: { fg: colors.magenta } }), ui.text(" Open in Autumn", { style: { fg: colors.gray } })]));

		return ui.box({ border: "rounded", px: 1 }, children);
	}

	function buildHints(s: ProductsState, hasPrev: boolean, hasMore: boolean): { key: string; label: string; visible?: boolean }[] {
		if (s.focusTarget === "sheet" && s.sheetOpen) {
			return [
				{ key: "Tab", label: "focus table" },
				{ key: "Esc", label: "close" },
				{ key: "c", label: "copy ID" },
				{ key: "o", label: "open" },
				{ key: "q", label: "quit" },
			];
		}
		return [
			{ key: "↑/↓", label: "navigate" },
			{ key: "n", label: "next page", visible: hasMore },
			{ key: "p", label: "prev page", visible: hasPrev },
			{ key: "Enter", label: "inspect" },
			{ key: "/", label: "search" },
			{ key: "x", label: "clear search", visible: !!s.searchQuery },
			{ key: "r", label: "refresh" },
			{ key: "q", label: "quit" },
		];
	}

	// ── Keys ───────────────────────────────────────────────────

	app.keys({
		"q": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) return;
			app.stop();
			opts.onExit();
		},
		"escape": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) {
				app.update(st => ({ ...st, searchOpen: false, searchInput: "" }));
				return;
			}
			if (s.sheetOpen) {
				app.update(st => ({ ...st, sheetOpen: false, focusTarget: "table" }));
			}
		},
		"return": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) {
				app.update(st => ({ ...st, searchOpen: false, searchQuery: st.searchInput, page: 1, selectedIndex: 0 }));
				return;
			}
			if (s.focusTarget === "table") {
				const pg = getPageData(s);
				const plan = pg.pageItems[s.selectedIndex];
				if (plan) app.update(st => ({ ...st, sheetOpen: true, selectedItem: plan, focusTarget: "sheet" }));
			}
		},
		"tab": (ctx) => {
			const s = ctx.state;
			if (s.sheetOpen) {
				app.update(st => ({ ...st, focusTarget: st.focusTarget === "table" ? "sheet" : "table" }));
			}
		},
		"up": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) return;
			if (s.focusTarget === "table") {
				app.update(st => {
					const ni = Math.max(0, st.selectedIndex - 1);
					const pg = getPageData(st);
					return { ...st, selectedIndex: ni, selectedItem: pg.pageItems[ni] ?? null };
				});
			}
		},
		"k": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) return;
			if (s.focusTarget === "table") {
				app.update(st => {
					const ni = Math.max(0, st.selectedIndex - 1);
					const pg = getPageData(st);
					return { ...st, selectedIndex: ni, selectedItem: pg.pageItems[ni] ?? null };
				});
			}
		},
		"down": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) return;
			if (s.focusTarget === "table") {
				app.update(st => {
					const pg = getPageData(st);
					const ni = Math.min(pg.pageItems.length - 1, st.selectedIndex + 1);
					return { ...st, selectedIndex: ni, selectedItem: pg.pageItems[ni] ?? null };
				});
			}
		},
		"j": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) return;
			if (s.focusTarget === "table") {
				app.update(st => {
					const pg = getPageData(st);
					const ni = Math.min(pg.pageItems.length - 1, st.selectedIndex + 1);
					return { ...st, selectedIndex: ni, selectedItem: pg.pageItems[ni] ?? null };
				});
			}
		},
		"/": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) return;
			app.update(st => ({ ...st, searchOpen: true, searchInput: st.searchQuery, focusTarget: "search" as FocusTarget }));
		},
		"s": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen || s.focusTarget === "sheet") return;
			app.update(st => ({ ...st, searchOpen: true, searchInput: st.searchQuery, focusTarget: "search" as FocusTarget }));
		},
		"x": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) return;
			if (s.searchQuery) {
				app.update(st => ({ ...st, searchQuery: "", page: 1, selectedIndex: 0 }));
			}
		},
		"r": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) return;
			loadPlans();
		},
		"c": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) return;
			if (s.focusTarget === "sheet" && s.sheetOpen && s.selectedItem) {
				clipboardy.writeSync(s.selectedItem.id);
				app.update(st => ({ ...st, copiedFeedback: true }));
				setTimeout(() => app.update(st => ({ ...st, copiedFeedback: false })), 2000);
			}
		},
		"o": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) return;
			if (s.focusTarget === "sheet" && s.sheetOpen && s.selectedItem) {
				const envPath = s.selectedItem.env === "live" ? "" : "/sandbox";
				open(`${AUTUMN_DASHBOARD_URL}${envPath}/products/${s.selectedItem.id}`);
			}
		},
		"n": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) return;
			if (s.focusTarget === "table") {
				const pg = getPageData(s);
				if (pg.hasMore) app.update(st => ({ ...st, page: st.page + 1, selectedIndex: 0 }));
			}
		},
		"p": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) return;
			if (s.focusTarget === "table") {
				const pg = getPageData(s);
				if (pg.hasPrev) app.update(st => ({ ...st, page: st.page - 1, selectedIndex: 0 }));
			}
		},
		"left": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) return;
			if (s.focusTarget === "table") {
				const pg = getPageData(s);
				if (pg.hasPrev) app.update(st => ({ ...st, page: st.page - 1, selectedIndex: 0 }));
			}
		},
		"right": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) return;
			if (s.focusTarget === "table") {
				const pg = getPageData(s);
				if (pg.hasMore) app.update(st => ({ ...st, page: st.page + 1, selectedIndex: 0 }));
			}
		},
	});

	// ── Start ──────────────────────────────────────────────────

	await app.start();
	await loadPlans();
}
