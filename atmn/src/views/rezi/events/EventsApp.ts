/**
 * Events Rezi TUI App — migrated from React Ink EventsView
 */
import { ui, rgb, type VNode } from "@rezi-ui/core";
import { createNodeApp } from "@rezi-ui/node";
import clipboardy from "clipboardy";
import { fetchEvents, fetchEventsAggregate, type AggregateBinSize, type AggregateRange, type ApiEventsListItem, type ApiEventsAggregateResponse } from "../../../lib/api/endpoints/events.js";
import { fetchFeatures } from "../../../lib/api/endpoints/features.js";
import type { ApiFeature } from "../../../lib/api/types/index.js";
import { AppEnv } from "../../../lib/env/detect.js";
import { getKey } from "../../../lib/env/keys.js";
import { APP_VERSION } from "../../../lib/version.js";
import {
	titleBar,
	bottomBar,
	loadingText,
	errorView,
	emptyView,
	card,
	keyValue,
	colors,
	formatDate,
	getPaginationDisplay,
} from "../helpers.js";

// ── Types ──────────────────────────────────────────────────────────

type ViewMode = "list" | "aggregate";
type FocusTarget = "table" | "sheet" | "filter";
type FilterField = "customer" | "timeRange" | "groupBy" | "features";
type TimeRangePreset = "24h" | "7d" | "30d" | "90d" | "all";

interface EventsFilterState {
	customerId: string;
	selectedFeatures: string[];
	timeRange: TimeRangePreset;
	groupBy: string;
}

const INITIAL_FILTERS: EventsFilterState = {
	customerId: "",
	selectedFeatures: [],
	timeRange: "all",
	groupBy: "",
};

const TIME_RANGE_OPTIONS: { value: TimeRangePreset; label: string }[] = [
	{ value: "24h", label: "Last 24 hours" },
	{ value: "7d", label: "Last 7 days" },
	{ value: "30d", label: "Last 30 days" },
	{ value: "90d", label: "Last 90 days" },
	{ value: "all", label: "All time" },
];

const BIN_SIZE_OPTIONS: { value: AggregateBinSize; label: string }[] = [
	{ value: "hour", label: "Hourly" },
	{ value: "day", label: "Daily" },
	{ value: "month", label: "Monthly" },
];

const GROUP_COLORS = [colors.magenta, rgb(80, 80, 255), colors.green, colors.yellow, colors.cyan, colors.red];
function getGroupColor(i: number) { return GROUP_COLORS[i % GROUP_COLORS.length]; }

const PAGE_SIZE = 50;

// ── Aggregate formatting (ported from useEventsAggregateApi) ───────

interface FormattedTimeBucket {
	period: number;
	label: string;
	values: Record<string, number>;
	groupedValues: Record<string, Record<string, number>>;
	groupKeys: string[];
	totalValue: number;
}

function formatPeriodLabel(ts: number, binSize: AggregateBinSize): string {
	const d = new Date(ts);
	switch (binSize) {
		case "hour": return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
		case "day": return `${d.getMonth() + 1}/${d.getDate()}`;
		case "month": return `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
	}
}

function formatAggregateResponse(resp: ApiEventsAggregateResponse, binSize: AggregateBinSize): FormattedTimeBucket[] {
	if (!resp?.list || !Array.isArray(resp.list)) return [];
	return resp.list.filter(b => b?.period != null).map(bucket => {
		const values: Record<string, number> = {};
		const groupedValues: Record<string, Record<string, number>> = {};
		const groupKeysSet = new Set<string>();
		let totalValue = 0;
		for (const [key, value] of Object.entries(bucket)) {
			if (key === "period") continue;
			if (typeof value === "number") { values[key] = value; totalValue += value; }
			else if (typeof value === "object" && value !== null) {
				const gd = value as Record<string, number>;
				groupedValues[key] = gd;
				let gs = 0;
				for (const [gk, gv] of Object.entries(gd)) { groupKeysSet.add(gk); if (typeof gv === "number") gs += gv; }
				values[key] = gs; totalValue += gs;
			}
		}
		return { period: Number(bucket.period), label: formatPeriodLabel(Number(bucket.period), binSize), values, groupedValues, groupKeys: Array.from(groupKeysSet).sort(), totalValue };
	});
}

function getTimeRangeStart(preset: TimeRangePreset): number | undefined {
	if (preset === "all" || preset === "custom" as string) return undefined;
	const now = Date.now();
	const ms: Record<string, number> = { "24h": 864e5, "7d": 6048e5, "30d": 2592e6, "90d": 7776e6 };
	return now - (ms[preset] ?? 0);
}

// ── State ──────────────────────────────────────────────────────────

interface EventsState {
	// Data
	events: ApiEventsListItem[];
	features: ApiFeature[];
	loading: boolean;
	error: string | null;
	hasMore: boolean;

	// Navigation
	page: number;
	selectedIndex: number;
	selectedItem: ApiEventsListItem | null;
	focusTarget: FocusTarget;
	sheetOpen: boolean;

	// View mode
	viewMode: ViewMode;
	binSize: AggregateBinSize;

	// Aggregate
	aggData: FormattedTimeBucket[] | null;
	aggTotals: Record<string, { count: number; sum: number }> | null;
	aggLoading: boolean;
	aggError: string | null;

	// Filters
	appliedFilters: EventsFilterState;
	draftFilters: EventsFilterState;
	isFilterOpen: boolean;
	filterField: FilterField;
	filterIndex: number;
	isEditingCustomer: boolean;
	isEditingGroupBy: boolean;
	customerInput: string;
	groupByInput: string;

	// Clipboard
	copiedFeedback: boolean;

	// CLI overrides
	cliCustomerId?: string;
	cliFeatureId?: string;
}

// ── App ────────────────────────────────────────────────────────────

export interface CreateEventsAppOptions {
	environment?: AppEnv;
	onExit: () => void;
	customerId?: string;
	featureId?: string;
}

export async function createEventsApp(opts: CreateEventsAppOptions) {
	const env = opts.environment ?? AppEnv.Sandbox;

	let currentState: EventsState;
	const app = createNodeApp<EventsState>({ config: { executionMode: "inline" },
		initialState: {
			events: [],
			features: [],
			loading: true,
			error: null,
			hasMore: false,
			page: 1,
			selectedIndex: 0,
			selectedItem: null,
			focusTarget: "table",
			sheetOpen: false,
			viewMode: "list",
			binSize: "day",
			aggData: null,
			aggTotals: null,
			aggLoading: false,
			aggError: null,
			appliedFilters: { ...INITIAL_FILTERS },
			draftFilters: { ...INITIAL_FILTERS },
			isFilterOpen: false,
			filterField: "timeRange",
			filterIndex: 4,
			isEditingCustomer: false,
			isEditingGroupBy: false,
			customerInput: "",
			groupByInput: "",
			copiedFeedback: false,
			cliCustomerId: opts.customerId,
			cliFeatureId: opts.featureId,
		},
	});

	// ── Helpers ─────────────────────────────────────────────────

	function effectiveCustomerId(s: EventsState): string | undefined {
		return s.appliedFilters.customerId || s.cliCustomerId || undefined;
	}

	function effectiveFeatureIds(s: EventsState): string[] | undefined {
		if (s.appliedFilters.selectedFeatures.length > 0) return s.appliedFilters.selectedFeatures;
		if (s.cliFeatureId) return [s.cliFeatureId];
		return undefined;
	}

	function hasActiveFilters(s: EventsState): boolean {
		return s.appliedFilters.customerId !== "" ||
			s.appliedFilters.selectedFeatures.length > 0 ||
			s.appliedFilters.timeRange !== "all" ||
			s.appliedFilters.groupBy !== "";
	}

	// ── Data fetching ──────────────────────────────────────────

	async function loadEvents() {
		const s = currentState;
		app.update(st => ({ ...st, loading: true, error: null }));
		try {
			const secretKey = getKey(env);
			const body: Record<string, unknown> = {
				limit: PAGE_SIZE,
				offset: (s.page - 1) * PAGE_SIZE,
			};
			const cid = effectiveCustomerId(s);
			if (cid) body.customer_id = cid;
			const fids = effectiveFeatureIds(s);
			if (fids) body.feature_id = fids;
			if (s.appliedFilters.timeRange !== "all") {
				const start = getTimeRangeStart(s.appliedFilters.timeRange);
				if (start) body.custom_range = { start };
			}
			const resp = await fetchEvents({ secretKey, customerId: cid, featureId: fids, offset: (s.page - 1) * PAGE_SIZE, limit: PAGE_SIZE, customRange: s.appliedFilters.timeRange !== "all" ? { start: getTimeRangeStart(s.appliedFilters.timeRange) } : undefined });
			app.update(st => {
				const sel = resp.list[st.selectedIndex] ?? resp.list[0] ?? null;
				return { ...st, events: resp.list, hasMore: resp.has_more, loading: false, selectedItem: sel, selectedIndex: Math.min(st.selectedIndex, Math.max(0, resp.list.length - 1)) };
			});
		} catch (e) {
			app.update(st => ({ ...st, error: e instanceof Error ? e.message : String(e), loading: false }));
		}
	}

	async function loadFeatures() {
		try {
			const secretKey = getKey(env);
			const list = await fetchFeatures({ secretKey, includeArchived: false });
			app.update(st => ({ ...st, features: list }));
		} catch { /* features are optional for filter dropdown */ }
	}

	async function loadAggregate() {
		const s = currentState;
		const cid = effectiveCustomerId(s);
		const fids = effectiveFeatureIds(s) ?? s.features.map(f => f.id);
		if (!cid || fids.length === 0) {
			app.update(st => ({ ...st, aggData: null, aggTotals: null, aggLoading: false }));
			return;
		}
		app.update(st => ({ ...st, aggLoading: true, aggError: null }));
		try {
			const secretKey = getKey(env);
			const range: AggregateRange = s.appliedFilters.timeRange === "all" ? "90d" : s.appliedFilters.timeRange as AggregateRange;
			let groupBy = s.appliedFilters.groupBy || undefined;
			if (groupBy && !groupBy.startsWith("properties.")) groupBy = `properties.${groupBy}`;
			const resp = await fetchEventsAggregate({ secretKey, customerId: cid, featureId: fids, range, binSize: s.binSize, groupBy });
			const formatted = formatAggregateResponse(resp, s.binSize);
			app.update(st => ({ ...st, aggData: formatted, aggTotals: resp.total ?? null, aggLoading: false }));
		} catch (e) {
			app.update(st => ({ ...st, aggError: e instanceof Error ? e.message : String(e), aggLoading: false }));
		}
	}

	async function refresh() {
		const s = currentState;
		if (s.viewMode === "aggregate") await loadAggregate();
		else await loadEvents();
	}

	// ── View ───────────────────────────────────────────────────

	app.view((s) => {
		currentState = s;
		const pag = getPaginationDisplay(s.page, s.events.length, PAGE_SIZE, s.hasMore);
		const filtersActive = hasActiveFilters(s);

		// Title bar extras
		const extras: { label: string; value: string; color?: ReturnType<typeof rgb> }[] = [
			{ label: "View", value: s.viewMode === "aggregate" ? "Aggregate" : "List", color: s.viewMode === "aggregate" ? colors.yellow : undefined },
		];
		if (s.viewMode === "aggregate") {
			extras.push({ label: "Bin", value: BIN_SIZE_OPTIONS.find(b => b.value === s.binSize)?.label ?? s.binSize, color: colors.cyan });
		}
		if (filtersActive || s.cliCustomerId || s.cliFeatureId) {
			extras.push({ label: "Filtered", value: "✓", color: colors.cyan });
		}

		const pagText = s.viewMode === "aggregate"
			? (s.aggTotals ? `${Object.values(s.aggTotals).reduce((a, t) => a + t.sum, 0).toLocaleString()} total` : s.aggLoading ? "Loading..." : "No data")
			: pag.text;

		const top = titleBar({ commandName: "atmn events", version: APP_VERSION, paginationText: pagText, extraItems: extras });

		// Bottom hints
		const hints = buildHints(s, pag.canGoPrev, pag.canGoNext, filtersActive);
		const bot = bottomBar(hints);

		// Loading
		if (s.loading && s.events.length === 0 && s.viewMode === "list") {
			return ui.column({}, [top, loadingText(`Loading ${env === AppEnv.Live ? "live" : "sandbox"} events...`), bot]);
		}
		// Error
		if (s.error && s.events.length === 0 && s.viewMode === "list") {
			return ui.column({}, [top, errorView(s.error, { onRetry: true }), bot]);
		}
		// Empty (list)
		if (s.events.length === 0 && !s.loading && s.viewMode === "list") {
			return ui.column({}, [top, emptyView("No events found", "Events are created when you track usage via the API"), bot]);
		}

		// Main content area
		let mainContent: VNode;
		if (s.viewMode === "aggregate") {
			mainContent = renderAggregateView(s);
		} else {
			mainContent = renderTable(s);
		}

		// Side panel
		let sidePanel: VNode | null = null;
		if (s.isFilterOpen) {
			sidePanel = renderFilterSheet(s);
		} else if (s.sheetOpen && s.selectedItem && s.viewMode === "list") {
			sidePanel = renderEventSheet(s);
		}

		const body = sidePanel
			? ui.row({ flex: 1 }, [ui.column({ flex: 1 }, [mainContent]), ui.column({ width: 44 }, [sidePanel])])
			: mainContent;

		return ui.column({}, [top, body, bot]);
	});

	// ── Render helpers ─────────────────────────────────────────

	function renderTable(s: EventsState): VNode {
		const tableData = s.events.map((e: ApiEventsListItem) => ({
			id: e.id,
			timestamp: formatDate(e.timestamp),
			customer_id: e.customer_id,
			feature_id: e.feature_id,
			value: String(e.value),
		}));
		return ui.table({
			id: "events-table",
			columns: [
				{ key: "id", header: "ID", flex: 1 },
				{ key: "timestamp", header: "Time", width: 16 },
				{ key: "customer_id", header: "Customer", flex: 1 },
				{ key: "feature_id", header: "Feature", flex: 1 },
				{ key: "value", header: "Value", width: 8 },
			],
			data: tableData,
			getRowKey: (row) => row.id,
			selection: s.selectedItem ? [s.selectedItem.id] : [],
			selectionMode: "single",
			onSelectionChange: (keys: string[]) => {
				const idx = s.events.findIndex(e => e.id === keys[0]);
				if (idx >= 0) app.update(st => ({ ...st, selectedIndex: idx, selectedItem: s.events[idx] }));
			},
			onRowPress: (_row, idx: number) => {
				const ev = s.events[idx];
				if (ev) app.update(st => ({ ...st, selectedIndex: idx, selectedItem: ev, sheetOpen: true, focusTarget: "sheet" }));
			},
		});
	}

	function renderEventSheet(s: EventsState): VNode {
		const ev = s.selectedItem!;
		const borderColor = s.focusTarget === "sheet" ? colors.magenta : colors.gray;
		const hasProps = ev.properties && Object.keys(ev.properties).length > 0;
		const children: VNode[] = [
			ui.text("Event Details", { style: { bold: true } }),
			ui.text(ev.id, { style: { fg: colors.gray, dim: true } }),
			ui.text(""),
			ui.text("Event Info", { style: { fg: colors.magenta, bold: true } }),
			keyValue("ID", ev.id),
			keyValue("Timestamp", formatDate(ev.timestamp)),
			keyValue("Customer", ev.customer_id),
			keyValue("Feature", ev.feature_id),
			keyValue("Value", String(ev.value)),
		];
		if (hasProps) {
			children.push(ui.text(""), ui.text("Properties", { style: { fg: colors.magenta, bold: true } }));
			children.push(ui.text(JSON.stringify(ev.properties, null, 2), { style: { fg: colors.gray } }));
		}
		children.push(ui.text(""));
		if (s.copiedFeedback) {
			children.push(ui.text("Copied!", { style: { fg: colors.green } }));
		} else {
			children.push(ui.row({}, [ui.text("[c]", { style: { fg: colors.magenta } }), ui.text(" Copy ID", { style: { fg: colors.gray } })]));
		}
		return ui.box({ border: "rounded", px: 1 }, children);
	}

	function renderFilterSheet(s: EventsState): VNode {
		const d = s.draftFilters;
		const af = s.filterField;
		const ai = s.filterIndex;
		const focused = s.isFilterOpen;

		const children: VNode[] = [
			ui.text("Filters", { style: { bold: true, fg: colors.magenta } }),
			ui.text(""),
			// Customer ID
			ui.text("Customer ID", { style: { fg: colors.magenta, bold: true } }),
		];

		if (s.isEditingCustomer) {
			children.push(ui.row({}, [
				ui.text(af === "customer" && focused ? "> " : "  ", { style: { fg: colors.magenta } }),
				ui.text(d.customerId || "(typing...)", { style: { fg: colors.cyan } }),
				ui.text("|", { style: { fg: colors.magenta } }),
			]));
			children.push(ui.input({ id: "customer-input", value: s.customerInput, onInput: (v: string) => app.update(st => ({ ...st, customerInput: v, draftFilters: { ...st.draftFilters, customerId: v } })) }));
		} else {
			children.push(ui.row({}, [
				ui.text(af === "customer" && focused ? "> " : "  ", { style: { fg: colors.magenta } }),
				ui.text(d.customerId || "(any)", { style: { fg: d.customerId ? colors.white : colors.gray } }),
			]));
		}

		// Time Range
		children.push(ui.text(""), ui.text("Time Range", { style: { fg: colors.magenta, bold: true } }));
		for (let i = 0; i < TIME_RANGE_OPTIONS.length; i++) {
			const opt = TIME_RANGE_OPTIONS[i];
			const isSel = d.timeRange === opt.value;
			const isAct = af === "timeRange" && ai === i && focused;
			children.push(ui.row({}, [
				ui.text(isAct ? "> " : "  ", { style: { fg: colors.magenta } }),
				ui.text(`${isSel ? "[x] " : "[ ] "}${opt.label}`, { style: { fg: isSel ? colors.cyan : isAct ? colors.white : colors.gray } }),
			]));
		}

		// Group By
		children.push(ui.text(""), ui.text("Group By", { style: { fg: colors.magenta, bold: true } }));
		// None
		const gbNoneActive = af === "groupBy" && ai === 0 && focused;
		children.push(ui.row({}, [
			ui.text(gbNoneActive ? "> " : "  ", { style: { fg: colors.magenta } }),
			ui.text(`${!d.groupBy ? "[x] " : "[ ] "}None`, { style: { fg: !d.groupBy ? colors.cyan : gbNoneActive ? colors.white : colors.gray } }),
		]));
		// Custom
		const gbCustActive = af === "groupBy" && ai === 1 && focused;
		if (s.isEditingGroupBy) {
			children.push(ui.row({}, [
				ui.text(gbCustActive ? "> " : "  ", { style: { fg: colors.magenta } }),
				ui.text(`properties.${s.groupByInput || "(typing...)"}`, { style: { fg: colors.cyan } }),
				ui.text("|", { style: { fg: colors.magenta } }),
			]));
			children.push(ui.input({ id: "groupby-input", value: s.groupByInput, onInput: (v: string) => {
				const prefixed = v && !v.startsWith("properties.") ? `properties.${v}` : v;
				app.update(st => ({ ...st, groupByInput: v, draftFilters: { ...st.draftFilters, groupBy: prefixed } }));
			}}));
		} else {
			children.push(ui.row({}, [
				ui.text(gbCustActive ? "> " : "  ", { style: { fg: colors.magenta } }),
				ui.text(d.groupBy ? `[x] ${d.groupBy}` : "[ ] Custom property...", { style: { fg: d.groupBy ? colors.cyan : gbCustActive ? colors.white : colors.gray } }),
			]));
		}

		// Features
		children.push(ui.text(""), ui.text("Features", { style: { fg: colors.magenta, bold: true } }));
		if (s.features.length === 0) {
			children.push(ui.text("No features available", { style: { fg: colors.gray } }));
		} else {
			const shown = s.features.slice(0, 10);
			for (let i = 0; i < shown.length; i++) {
				const f = shown[i];
				const isSel = d.selectedFeatures.includes(f.id);
				const isAct = af === "features" && ai === i && focused;
				children.push(ui.row({}, [
					ui.text(isAct ? "> " : "  ", { style: { fg: colors.magenta } }),
					ui.text(`${isSel ? "[x] " : "[ ] "}${f.name || f.id}`, { style: { fg: isSel ? colors.cyan : isAct ? colors.white : colors.gray } }),
				]));
			}
			if (s.features.length > 10) {
				children.push(ui.text(`  ... and ${s.features.length - 10} more`, { style: { dim: true } }));
			}
		}

		// Active filters summary
		if (d.customerId || d.selectedFeatures.length > 0 || d.timeRange !== "all" || d.groupBy) {
			children.push(ui.text(""), ui.text("Active Filters", { style: { fg: colors.magenta, bold: true } }));
			if (d.customerId) children.push(ui.text(`Customer: ${d.customerId}`, { style: { fg: colors.cyan } }));
			if (d.timeRange !== "all") children.push(ui.text(`Time: ${TIME_RANGE_OPTIONS.find(o => o.value === d.timeRange)?.label ?? d.timeRange}`, { style: { fg: colors.cyan } }));
			if (d.groupBy) children.push(ui.text(`Group: ${d.groupBy}`, { style: { fg: colors.cyan } }));
			if (d.selectedFeatures.length > 0) children.push(ui.text(`Features: ${d.selectedFeatures.length} selected`, { style: { fg: colors.cyan } }));
		}

		return ui.box({ border: "rounded", px: 1 }, children);
	}

	function renderAggregateView(s: EventsState): VNode {
		const cid = effectiveCustomerId(s);
		const fids = effectiveFeatureIds(s) ?? s.features.map(f => f.id);

		if (!cid) {
			return ui.column({ py: 1 }, [
				ui.text("Customer ID Required", { style: { fg: colors.yellow, bold: true } }),
				ui.text("The aggregate view requires a customer ID to fetch data.", { style: { fg: colors.gray } }),
				ui.row({}, [ui.text("Press ", { style: { fg: colors.gray } }), ui.text("f", { style: { fg: colors.cyan } }), ui.text(" to open filters and enter a customer ID.", { style: { fg: colors.gray } })]),
			]);
		}
		if (fids.length === 0) {
			return ui.column({ py: 1 }, [
				ui.text("No Features Available", { style: { fg: colors.yellow, bold: true } }),
				ui.text("Create features or select features in the filter to see aggregate data.", { style: { fg: colors.gray } }),
			]);
		}
		if (s.aggLoading && !s.aggData) {
			return ui.column({}, [ui.text("Loading aggregate data...", { style: { fg: colors.yellow } })]);
		}
		if (s.aggError) {
			return ui.column({ py: 1 }, [
				ui.text("Error loading aggregate data", { style: { fg: colors.red, bold: true } }),
				ui.text(s.aggError, { style: { fg: colors.red } }),
			]);
		}
		if (!s.aggData || s.aggData.length === 0 || !s.aggTotals) {
			return ui.column({}, [
				ui.text("No aggregate data available.", { style: { fg: colors.gray } }),
				ui.text("Try adjusting the time range or selecting different features.", { style: { fg: colors.gray } }),
			]);
		}

		// Summary stats
		const featureEntries = Object.entries(s.aggTotals);
		const totalEvents = featureEntries.reduce((a, [, t]) => a + t.count, 0);
		const totalValue = featureEntries.reduce((a, [, t]) => a + t.sum, 0);

		const statsRow = ui.row({ gap: 3 }, [
			ui.row({}, [ui.text(totalEvents.toLocaleString(), { style: { fg: colors.cyan, bold: true } }), ui.text(" events", { style: { fg: colors.gray } })]),
			ui.row({}, [ui.text(String(featureEntries.length), { style: { fg: colors.green, bold: true } }), ui.text(" features", { style: { fg: colors.gray } })]),
			ui.row({}, [ui.text(totalValue.toLocaleString(), { style: { fg: colors.magenta, bold: true } }), ui.text(" total", { style: { fg: colors.gray } })]),
		]);

		// ASCII chart
		const maxBuckets = 50;
		const maxBarHeight = 10;
		const buckets = s.aggData.slice(-maxBuckets);
		const maxVal = Math.max(...buckets.map(b => b.totalValue), 1);
		const isGrouped = buckets.some(b => Object.keys(b.groupedValues).length > 0);

		const chartLines: VNode[] = [];
		const binLabel = s.binSize === "hour" ? "Hourly" : s.binSize === "month" ? "Monthly" : "Daily";
		chartLines.push(ui.text(`${binLabel} Events`, { style: { bold: true, fg: colors.gray } }));
		chartLines.push(ui.row({}, [ui.text(`${maxVal.toString().padStart(5)} `, { style: { fg: colors.gray } }), ui.text("─".repeat(buckets.length), { style: { fg: colors.gray } })]));

		if (isGrouped) {
			const allGroupKeys = Array.from(new Set(buckets.flatMap(b => Object.values(b.groupedValues).flatMap(gd => Object.keys(gd))))).sort();
			for (let row = maxBarHeight - 1; row >= 0; row--) {
				const threshold = (row / maxBarHeight) * maxVal;
				const chars: VNode[] = [ui.text("      ", { style: { fg: colors.gray } })];
				for (const bucket of buckets) {
					if (bucket.totalValue <= threshold) {
						chars.push(ui.text(" "));
					} else {
						let cum = 0; let foundColor = colors.gray;
						for (let i = 0; i < allGroupKeys.length; i++) {
							const gk = allGroupKeys[i];
							let gv = 0;
							for (const gd of Object.values(bucket.groupedValues)) { gv += (gd[gk] ?? 0); }
							const prev = cum; cum += gv;
							if (cum > threshold && prev < ((row + 1) / maxBarHeight) * maxVal) { foundColor = getGroupColor(i); break; }
						}
						chars.push(ui.text("█", { style: { fg: foundColor } }));
					}
				}
				chartLines.push(ui.row({}, chars));
			}
		} else {
			for (let row = maxBarHeight - 1; row >= 0; row--) {
				const threshold = (row / maxBarHeight) * maxVal;
				let rowStr = "";
				for (const bucket of buckets) { rowStr += bucket.totalValue > threshold ? "█" : " "; }
				chartLines.push(ui.row({}, [ui.text("      ", { style: { fg: colors.gray } }), ui.text(rowStr, { style: { fg: colors.cyan } })]));
			}
		}

		chartLines.push(ui.row({}, [ui.text(`    0 `, { style: { fg: colors.gray } }), ui.text("─".repeat(buckets.length), { style: { fg: colors.gray } })]));
		if (buckets.length > 0) {
			const first = buckets[0]?.label ?? "";
			const last = buckets.length > 1 ? buckets[buckets.length - 1]?.label ?? "" : "";
			chartLines.push(ui.row({}, [ui.text("      ", { style: { fg: colors.gray } }), ui.text(first, { style: { fg: colors.gray } }), ui.text("".padEnd(Math.max(0, buckets.length - first.length - last.length))), ui.text(last, { style: { fg: colors.gray } })]));
		}

		// By feature or group legend
		if (isGrouped) {
			const allGroupKeys = Array.from(new Set(buckets.flatMap(b => Object.values(b.groupedValues).flatMap(gd => Object.keys(gd))))).sort();
			chartLines.push(ui.text(""), ui.text("Groups:", { style: { fg: colors.gray, bold: true } }));
			for (let i = 0; i < Math.min(6, allGroupKeys.length); i++) {
				chartLines.push(ui.row({ gap: 1 }, [ui.text("█", { style: { fg: getGroupColor(i) } }), ui.text(allGroupKeys[i])]));
			}
			if (allGroupKeys.length > 6) chartLines.push(ui.text(`  ... and ${allGroupKeys.length - 6} more`, { style: { fg: colors.gray } }));
		} else {
			chartLines.push(ui.text(""), ui.text("By Feature", { style: { fg: colors.gray, bold: true } }));
			for (let i = 0; i < Math.min(8, featureEntries.length); i++) {
				const [fid, stats] = featureEntries[i];
				const label = fid.length > 20 ? `${fid.slice(0, 18)}..` : fid.padEnd(20);
				chartLines.push(ui.row({ gap: 1 }, [
					ui.text("█", { style: { fg: getGroupColor(i) } }),
					ui.text(label),
					ui.text(`${stats.count.toLocaleString()} events, ${stats.sum.toLocaleString()} total`, { style: { fg: colors.gray } }),
				]));
			}
		}

		return ui.column({}, [statsRow, ui.text(""), ...chartLines]);
	}

	function buildHints(s: EventsState, canGoPrev: boolean, canGoNext: boolean, filtersActive: boolean): { key: string; label: string; visible?: boolean }[] {
		if (s.isFilterOpen) {
			return [
				{ key: "↑/↓", label: "navigate" },
				{ key: "Tab", label: "next field" },
				{ key: "Space", label: "toggle" },
				{ key: "Enter", label: "apply" },
				{ key: "x", label: "clear all" },
				{ key: "Esc", label: "close" },
			];
		}
		if (s.viewMode === "aggregate") {
			return [
				{ key: "v", label: "list view" },
				{ key: "g", label: "time grouping" },
				{ key: "f", label: filtersActive ? "filter *" : "filter" },
				{ key: "r", label: "refresh" },
				{ key: "q", label: "quit" },
			];
		}
		if (s.focusTarget === "sheet" && s.sheetOpen) {
			return [
				{ key: "Tab", label: "focus table" },
				{ key: "Esc", label: "close" },
				{ key: "c", label: "copy ID" },
				{ key: "v", label: "aggregate" },
				{ key: "f", label: "filter" },
				{ key: "q", label: "quit" },
			];
		}
		return [
			{ key: "↑/↓", label: "navigate" },
			{ key: "n", label: "next page", visible: canGoNext },
			{ key: "p", label: "prev page", visible: canGoPrev },
			{ key: "Enter", label: "inspect" },
			{ key: "v", label: "aggregate" },
			{ key: "f", label: filtersActive ? "filter *" : "filter" },
			{ key: "r", label: "refresh" },
			{ key: "q", label: "quit" },
		];
	}

	// ── Keys ───────────────────────────────────────────────────

	app.keys({
		"q": (ctx) => {
			const s = ctx.state;
			if (s.isFilterOpen || s.isEditingCustomer || s.isEditingGroupBy) return;
			app.stop();
			opts.onExit();
		},
		"escape": (ctx) => {
			const s = ctx.state;
			if (s.isEditingCustomer) { app.update(st => ({ ...st, isEditingCustomer: false })); return; }
			if (s.isEditingGroupBy) { app.update(st => ({ ...st, isEditingGroupBy: false })); return; }
			if (s.isFilterOpen) { app.update(st => ({ ...st, isFilterOpen: false })); return; }
			if (s.sheetOpen) { app.update(st => ({ ...st, sheetOpen: false, focusTarget: "table" })); return; }
		},
		"return": (ctx) => {
			const s = ctx.state;
			if (s.isEditingCustomer) { app.update(st => ({ ...st, isEditingCustomer: false })); return; }
			if (s.isEditingGroupBy) { app.update(st => ({ ...st, isEditingGroupBy: false })); return; }
			if (s.isFilterOpen) {
				app.update(st => ({ ...st, appliedFilters: { ...st.draftFilters }, isFilterOpen: false, isEditingCustomer: false, isEditingGroupBy: false, page: 1, selectedIndex: 0 }));
				setTimeout(() => refresh(), 0);
				return;
			}
			if (s.focusTarget === "table" && s.viewMode === "list" && s.events.length > 0) {
				const ev = s.events[s.selectedIndex];
				if (ev) app.update(st => ({ ...st, sheetOpen: true, selectedItem: ev, focusTarget: "sheet" }));
			}
		},
		"tab": (ctx) => {
			const s = ctx.state;
			if (s.isFilterOpen) {
				// Navigate between filter fields
				if (s.isEditingCustomer) app.update(st => ({ ...st, isEditingCustomer: false }));
				if (s.isEditingGroupBy) app.update(st => ({ ...st, isEditingGroupBy: false }));
				const fields: FilterField[] = ["customer", "timeRange", "groupBy", "features"];
				const idx = fields.indexOf(s.filterField);
				const next = fields[(idx + 1) % fields.length];
				app.update(st => ({ ...st, filterField: next, filterIndex: 0 }));
				return;
			}
			if (s.sheetOpen) {
				app.update(st => ({ ...st, focusTarget: st.focusTarget === "table" ? "sheet" : "table" }));
			}
		},
		"up": (ctx) => {
			const s = ctx.state;
			if (s.isEditingCustomer || s.isEditingGroupBy) return;
			if (s.isFilterOpen) {
				if (s.filterField === "customer") return;
				app.update(st => ({ ...st, filterIndex: Math.max(0, st.filterIndex - 1) }));
				return;
			}
			if (s.focusTarget === "table" && s.viewMode === "list") {
				app.update(st => {
					const ni = Math.max(0, st.selectedIndex - 1);
					return { ...st, selectedIndex: ni, selectedItem: st.events[ni] ?? null };
				});
			}
		},
		"k": (ctx) => {
			const s = ctx.state;
			if (s.isEditingCustomer || s.isEditingGroupBy || s.isFilterOpen) return;
			if (s.focusTarget === "table" && s.viewMode === "list") {
				app.update(st => {
					const ni = Math.max(0, st.selectedIndex - 1);
					return { ...st, selectedIndex: ni, selectedItem: st.events[ni] ?? null };
				});
			}
		},
		"down": (ctx) => {
			const s = ctx.state;
			if (s.isEditingCustomer || s.isEditingGroupBy) return;
			if (s.isFilterOpen) {
				if (s.filterField === "customer") return;
				let max = 0;
				if (s.filterField === "timeRange") max = TIME_RANGE_OPTIONS.length - 1;
				else if (s.filterField === "groupBy") max = 1;
				else if (s.filterField === "features") max = Math.min(s.features.length - 1, 9);
				app.update(st => ({ ...st, filterIndex: Math.min(max, st.filterIndex + 1) }));
				return;
			}
			if (s.focusTarget === "table" && s.viewMode === "list") {
				app.update(st => {
					const ni = Math.min(st.events.length - 1, st.selectedIndex + 1);
					return { ...st, selectedIndex: ni, selectedItem: st.events[ni] ?? null };
				});
			}
		},
		"j": (ctx) => {
			const s = ctx.state;
			if (s.isEditingCustomer || s.isEditingGroupBy || s.isFilterOpen) return;
			if (s.focusTarget === "table" && s.viewMode === "list") {
				app.update(st => {
					const ni = Math.min(st.events.length - 1, st.selectedIndex + 1);
					return { ...st, selectedIndex: ni, selectedItem: st.events[ni] ?? null };
				});
			}
		},
		"space": (ctx) => {
			const s = ctx.state;
			if (!s.isFilterOpen) return;
			if (s.isEditingCustomer || s.isEditingGroupBy) return;
			if (s.filterField === "customer") {
				app.update(st => ({ ...st, isEditingCustomer: true, customerInput: st.draftFilters.customerId }));
				return;
			}
			if (s.filterField === "timeRange") {
				const presets: TimeRangePreset[] = ["24h", "7d", "30d", "90d", "all"];
				const val = presets[s.filterIndex];
				if (val) app.update(st => ({ ...st, draftFilters: { ...st.draftFilters, timeRange: val } }));
				return;
			}
			if (s.filterField === "groupBy") {
				if (s.filterIndex === 0) app.update(st => ({ ...st, draftFilters: { ...st.draftFilters, groupBy: "" } }));
				else app.update(st => ({ ...st, isEditingGroupBy: true, groupByInput: (st.draftFilters.groupBy ?? "").replace(/^properties\./, "") }));
				return;
			}
			if (s.filterField === "features") {
				const feat = s.features[s.filterIndex];
				if (!feat) return;
				app.update(st => {
					const sel = st.draftFilters.selectedFeatures;
					const has = sel.includes(feat.id);
					return { ...st, draftFilters: { ...st.draftFilters, selectedFeatures: has ? sel.filter(id => id !== feat.id) : [...sel, feat.id] } };
				});
			}
		},
		"x": (ctx) => {
			const s = ctx.state;
			if (s.isEditingCustomer || s.isEditingGroupBy) return;
			if (s.isFilterOpen) {
				app.update(st => ({ ...st, draftFilters: { ...INITIAL_FILTERS }, appliedFilters: { ...INITIAL_FILTERS } }));
				return;
			}
		},
		"v": (ctx) => {
			const s = ctx.state;
			if (s.isFilterOpen || s.isEditingCustomer || s.isEditingGroupBy) return;
			const newMode = s.viewMode === "list" ? "aggregate" : "list";
			app.update(st => ({ ...st, viewMode: newMode }));
			if (newMode === "aggregate") {
				setTimeout(() => loadAggregate(), 0);
			}
		},
		"f": (ctx) => {
			const s = ctx.state;
			if (s.isEditingCustomer || s.isEditingGroupBy) return;
			if (s.isFilterOpen) return;
			const trIdx = TIME_RANGE_OPTIONS.findIndex(o => o.value === s.appliedFilters.timeRange);
			app.update(st => ({
				...st,
				isFilterOpen: true,
				draftFilters: { ...st.appliedFilters },
				filterField: "timeRange",
				filterIndex: trIdx >= 0 ? trIdx : 4,
			}));
		},
		"r": (ctx) => {
			const s = ctx.state;
			if (s.isFilterOpen || s.isEditingCustomer || s.isEditingGroupBy) return;
			refresh();
		},
		"g": (ctx) => {
			const s = ctx.state;
			if (s.isFilterOpen || s.isEditingCustomer || s.isEditingGroupBy) return;
			if (s.viewMode !== "aggregate") return;
			const idx = BIN_SIZE_OPTIONS.findIndex(b => b.value === s.binSize);
			const next = BIN_SIZE_OPTIONS[(idx + 1) % BIN_SIZE_OPTIONS.length].value;
			app.update(st => ({ ...st, binSize: next }));
			setTimeout(() => loadAggregate(), 0);
		},
		"c": (ctx) => {
			const s = ctx.state;
			if (s.isFilterOpen || s.isEditingCustomer || s.isEditingGroupBy) return;
			if (s.focusTarget === "sheet" && s.sheetOpen && s.selectedItem) {
				clipboardy.writeSync(s.selectedItem.id);
				app.update(st => ({ ...st, copiedFeedback: true }));
				setTimeout(() => app.update(st => ({ ...st, copiedFeedback: false })), 2000);
			}
		},
		"n": (ctx) => {
			const s = ctx.state;
			if (s.isFilterOpen || s.isEditingCustomer || s.isEditingGroupBy) return;
			if (s.viewMode === "list" && s.focusTarget === "table" && s.hasMore) {
				app.update(st => ({ ...st, page: st.page + 1, selectedIndex: 0 }));
				setTimeout(() => loadEvents(), 0);
			}
		},
		"p": (ctx) => {
			const s = ctx.state;
			if (s.isFilterOpen || s.isEditingCustomer || s.isEditingGroupBy) return;
			if (s.viewMode === "list" && s.focusTarget === "table" && s.page > 1) {
				app.update(st => ({ ...st, page: st.page - 1, selectedIndex: 0 }));
				setTimeout(() => loadEvents(), 0);
			}
		},
		"left": (ctx) => {
			const s = ctx.state;
			if (s.isFilterOpen || s.isEditingCustomer || s.isEditingGroupBy) return;
			if (s.viewMode === "list" && s.focusTarget === "table" && s.page > 1) {
				app.update(st => ({ ...st, page: st.page - 1, selectedIndex: 0 }));
				setTimeout(() => loadEvents(), 0);
			}
		},
		"right": (ctx) => {
			const s = ctx.state;
			if (s.isFilterOpen || s.isEditingCustomer || s.isEditingGroupBy) return;
			if (s.viewMode === "list" && s.focusTarget === "table" && s.hasMore) {
				app.update(st => ({ ...st, page: st.page + 1, selectedIndex: 0 }));
				setTimeout(() => loadEvents(), 0);
			}
		},
	});

	// ── Start ──────────────────────────────────────────────────

	await app.start();
	await Promise.all([loadEvents(), loadFeatures()]);
}
