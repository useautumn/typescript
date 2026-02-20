/**
 * Rezi TUI implementation of the Customers command view.
 * Replaces the React Ink CustomersView with a pure Rezi app.
 */
import { ui, rgb, type VNode } from "@rezi-ui/core";
import { createNodeApp } from "@rezi-ui/node";
import clipboard from "clipboardy";
import open from "open";
import type { ApiCustomer } from "../../../lib/api/endpoints/customers.js";
import { request, type ApiError } from "../../../lib/api/client.js";
import { AppEnv } from "../../../lib/env/detect.js";
import { getKey } from "../../../lib/env/keys.js";
import { APP_VERSION } from "../../../lib/version.js";
import {
	colors,
	card,
	keyValue,
	titleBar,
	bottomBar,
	loadingText,
	errorView,
	emptyView,
	formatDate,
	getPaginationDisplay,
} from "../helpers.js";
import type {
	ApiCustomerExpanded,
	ApiSubscription,
	ApiBalance,
	ApiEntity,
	ApiInvoice,
	ApiRewards,
	ApiDiscount,
	ApiReferral,
} from "../../react/customers/types.js";

const AUTUMN_DASHBOARD_URL = "https://app.useautumn.com";
const PAGE_SIZE = 50;

const EXPAND_PARAMS = [
	"invoices",
	"rewards",
	"entities",
	"referrals",
	"subscriptions.plan",
	"scheduled_subscriptions.plan",
	"balances.feature",
].join(",");

// ─── Types ───────────────────────────────────────────────────────────────────

type FocusTarget = "table" | "sheet" | "search";

interface ListCustomersResponse {
	list: ApiCustomer[];
	has_more: boolean;
	offset: number;
	limit: number;
	total: number;
}

interface CustomersState {
	page: number;
	selectedIndex: number;
	customers: ApiCustomer[];
	hasMore: boolean;
	loading: boolean;
	fetching: boolean;
	error: string | null;
	sheetOpen: boolean;
	focusTarget: FocusTarget;
	selectedCustomer: ApiCustomer | null;
	expandedCustomer: ApiCustomerExpanded | null;
	expandedLoading: boolean;
	expandedError: string | null;
	searchOpen: boolean;
	searchQuery: string;
	searchInput: string;
	copiedFeedback: boolean;
}

// ─── Data fetching ───────────────────────────────────────────────────────────

async function fetchCustomers(
	environment: AppEnv,
	page: number,
	search: string,
): Promise<ListCustomersResponse> {
	const secretKey = getKey(environment);
	const offset = (page - 1) * PAGE_SIZE;
	const body: Record<string, unknown> = {
		limit: PAGE_SIZE,
		offset,
		search: search.trim() || undefined,
	};
	return request<ListCustomersResponse>({
		method: "POST",
		path: "/v1/customers/list",
		secretKey,
		body,
	});
}

async function fetchExpandedCustomer(
	environment: AppEnv,
	customerId: string,
): Promise<ApiCustomerExpanded> {
	const secretKey = getKey(environment);
	return request<ApiCustomerExpanded>({
		method: "GET",
		path: `/v1/customers/${encodeURIComponent(customerId)}`,
		secretKey,
		queryParams: { expand: EXPAND_PARAMS },
	});
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

function formatTimestamp(timestamp: number): string {
	const ms = timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp;
	const date = new Date(ms);
	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatCurrency(dollars: number, currency: string): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency.toUpperCase(),
	}).format(dollars);
}

function formatDiscountValue(discount: ApiDiscount): string {
	switch (discount.type) {
		case "percentage_discount":
			return `${discount.discount_value}% off`;
		case "fixed_discount":
			return `$${(discount.discount_value / 100).toFixed(2)} off`;
		case "free_product":
			return "Free product";
		case "invoice_credits":
			return `$${(discount.discount_value / 100).toFixed(2)} credits`;
		default:
			return `${discount.discount_value}`;
	}
}

function subStatusColor(status: string, pastDue: boolean): ReturnType<typeof rgb> {
	if (pastDue) return colors.red;
	switch (status) {
		case "active": return colors.green;
		case "scheduled": return colors.cyan;
		case "expired": return colors.gray;
		default: return colors.white;
	}
}

function subStatusIcon(status: string): string {
	return status === "active" ? "●" : "○";
}

function invoiceStatusColor(status: string): ReturnType<typeof rgb> {
	switch (status) {
		case "paid": return colors.green;
		case "open": case "draft": return colors.yellow;
		case "void": case "uncollectible": return colors.gray;
		default: return colors.white;
	}
}

function invoiceStatusIcon(status: string): string {
	switch (status) {
		case "paid": return "✓";
		case "void": case "uncollectible": return "✗";
		default: return "○";
	}
}

// ─── Sheet section renderers ─────────────────────────────────────────────────

function renderSubscriptionRow(sub: ApiSubscription): VNode {
	const planName = sub.plan?.name ?? sub.plan_id;
	const sc = subStatusColor(sub.status, sub.past_due);
	const details: VNode[] = [];

	details.push(ui.text(`Status: ${sub.status}${sub.past_due ? " (past due)" : ""}`, { style: { dim: true } }));
	if (sub.trial_ends_at) details.push(ui.text(`Trial ends: ${formatTimestamp(sub.trial_ends_at)}`, { style: { dim: true } }));
	if (sub.current_period_end) details.push(ui.text(`Period ends: ${formatTimestamp(sub.current_period_end)}`, { style: { dim: true } }));
	if (sub.expires_at) details.push(ui.text(`Expires: ${formatTimestamp(sub.expires_at)}`, { style: { dim: true } }));
	if (sub.canceled_at) details.push(ui.text(`Canceled: ${formatTimestamp(sub.canceled_at)}`, { style: { fg: colors.yellow, dim: true } }));

	return ui.column({}, [
		ui.row({}, [
			ui.text(`${subStatusIcon(sub.status)} `, { style: { fg: sc } }),
			ui.text(planName, { style: { bold: true } }),
			...(sub.add_on ? [ui.text(" (add-on)", { style: { dim: true } })] : []),
			...(sub.default ? [ui.text(" (default)", { style: { fg: colors.cyan } })] : []),
		]),
		ui.column({ pl: 2 }, details),
	]);
}

function renderSubscriptionsSection(subscriptions: ApiSubscription[], title: string): VNode {
	if (subscriptions.length === 0) {
		return ui.column({}, [
			ui.text(title, { style: { fg: colors.gray, bold: true } }),
			ui.text("No subscriptions", { style: { dim: true } }),
		]);
	}

	return ui.column({}, [
		ui.text(`${title} (${subscriptions.length})`, { style: { fg: colors.gray, bold: true } }),
		ui.column({ pl: 1 }, subscriptions.map(renderSubscriptionRow)),
	]);
}

function renderBalancesSection(balances: Record<string, ApiBalance>): VNode | null {
	const list = Object.values(balances);
	if (list.length === 0) return null;

	const booleans = list.filter((b) => b.feature?.type === "boolean");
	const metered = list.filter((b) => b.feature?.type !== "boolean");
	const parts: VNode[] = [];

	if (booleans.length > 0) {
		parts.push(ui.column({}, [
			ui.text("Features", { style: { fg: colors.gray, bold: true } }),
			...booleans.map((b) =>
				ui.row({}, [
					ui.text("ON ", { style: { fg: colors.green } }),
					ui.text(b.feature?.name ?? b.feature_id),
				]),
			),
		]));
	}

	if (metered.length > 0) {
		parts.push(ui.column({ mt: booleans.length > 0 ? 1 : 0 }, [
			ui.text("Usage", { style: { fg: colors.gray, bold: true } }),
			...metered.map((b) => {
				const name = b.feature?.display?.plural ?? b.feature?.display?.singular ?? b.feature?.name ?? b.feature_id;
				if (b.unlimited) {
					return ui.row({}, [
						ui.text(`${name}: `),
						ui.text("Unlimited", { style: { fg: colors.cyan, bold: true } }),
					]);
				}
				const total = b.granted_balance + b.purchased_balance;
				if (total <= 0) {
					return ui.row({}, [ui.text(`${name}: `), ui.text("No allocation", { style: { dim: true } })]);
				}
				const remaining = b.current_balance;
				const isOverage = remaining < 0;
				const valColor = isOverage ? colors.red : remaining < total * 0.2 ? colors.yellow : colors.white;
				const parts: VNode[] = [
					ui.text(`${name}: `),
					ui.text(`${remaining.toLocaleString()} / ${total.toLocaleString()}`, { style: { fg: valColor } }),
				];
				if (isOverage) parts.push(ui.text(" (overage)", { style: { fg: colors.red } }));
				const rows: VNode[] = [ui.row({}, parts)];
				if (b.reset?.resets_at) {
					rows.push(ui.text(`Resets: ${formatTimestamp(b.reset.resets_at)}`, { style: { dim: true } }));
				}
				return ui.column({}, rows);
			}),
		]));
	}

	return ui.column({}, parts);
}

function renderEntitiesSection(entities: ApiEntity[]): VNode {
	if (entities.length === 0) {
		return ui.column({}, [
			ui.text("Entities", { style: { fg: colors.gray, bold: true } }),
			ui.text("No entities", { style: { dim: true } }),
		]);
	}

	const items = entities.slice(0, 10).map((e) => {
		const name = e.name ?? e.id ?? "Unknown";
		return ui.row({}, [
			ui.text("- ", { style: { fg: colors.gray } }),
			ui.text(name),
			...(e.feature_id ? [ui.text(` (${e.feature_id})`, { style: { dim: true } })] : []),
		]);
	});

	if (entities.length > 10) {
		items.push(ui.text(`...and ${entities.length - 10} more`, { style: { dim: true } }));
	}

	return ui.column({}, [
		ui.text(`Entities (${entities.length})`, { style: { fg: colors.gray, bold: true } }),
		ui.column({ pl: 1 }, items),
	]);
}

function renderInvoicesSection(invoices: ApiInvoice[]): VNode {
	if (invoices.length === 0) {
		return ui.column({}, [
			ui.text("Invoices", { style: { fg: colors.gray, bold: true } }),
			ui.text("No invoices", { style: { dim: true } }),
		]);
	}

	const items = invoices.slice(0, 5).map((inv) => {
		const sc = invoiceStatusColor(inv.status);
		return ui.row({}, [
			ui.text(`${invoiceStatusIcon(inv.status)} `, { style: { fg: sc } }),
			ui.text(formatCurrency(inv.total, inv.currency)),
			ui.text(` - ${formatTimestamp(inv.created_at)}`, { style: { dim: true } }),
			ui.text(` (${inv.status})`, { style: { fg: sc } }),
		]);
	});

	if (invoices.length > 5) {
		items.push(ui.text(`...and ${invoices.length - 5} more`, { style: { dim: true } }));
	}

	return ui.column({}, [
		ui.text(`Invoices (${invoices.length})`, { style: { fg: colors.gray, bold: true } }),
		ui.column({ pl: 1 }, items),
	]);
}

function renderRewardsSection(rewards: ApiRewards | null | undefined): VNode | null {
	const discounts = rewards?.discounts ?? [];
	if (discounts.length === 0) return null;

	return ui.column({}, [
		ui.text(`Rewards (${discounts.length})`, { style: { fg: colors.gray, bold: true } }),
		ui.column({ pl: 1 }, discounts.map((d) =>
			ui.row({}, [
				ui.text("● ", { style: { fg: colors.green } }),
				ui.text(d.name),
				ui.text(" - ", { style: { dim: true } }),
				ui.text(formatDiscountValue(d), { style: { fg: colors.cyan } }),
				...(d.duration_type !== "forever" ? [ui.text(` (${d.duration_type})`, { style: { dim: true } })] : []),
			]),
		)),
	]);
}

function renderReferralsSection(referrals: ApiReferral[]): VNode | null {
	if (referrals.length === 0) return null;

	const items = referrals.slice(0, 5).map((r) => {
		const name = r.customer.name ?? r.customer.email ?? r.customer.id;
		return ui.row({}, [
			ui.text(r.reward_applied ? "✓ " : "○ ", { style: { fg: r.reward_applied ? colors.green : colors.yellow } }),
			ui.text(name),
			ui.text(` - ${formatTimestamp(r.created_at)}`, { style: { dim: true } }),
			...(!r.reward_applied ? [ui.text(" (pending)", { style: { fg: colors.yellow } })] : []),
		]);
	});

	if (referrals.length > 5) {
		items.push(ui.text(`...and ${referrals.length - 5} more`, { style: { dim: true } }));
	}

	return ui.column({}, [
		ui.text(`Referrals (${referrals.length})`, { style: { fg: colors.gray, bold: true } }),
		ui.column({ pl: 1 }, items),
	]);
}

// ─── Sheet view ──────────────────────────────────────────────────────────────

function renderCustomerSheet(state: CustomersState): VNode {
	const customer = state.selectedCustomer!;
	const expanded = state.expandedCustomer;
	const display = expanded ?? customer;
	const borderColor = state.focusTarget === "sheet" ? colors.magenta : colors.gray;
	const title = display.name || display.id || display.email || "Unknown";

	const children: VNode[] = [];

	// Title
	children.push(ui.text(title, { style: { fg: colors.white, bold: true } }));

	// Basic info
	children.push(ui.column({ mt: 1 }, [
		ui.row({}, [ui.text("ID: ", { style: { fg: colors.gray } }), ui.text(display.id)]),
		ui.row({}, [ui.text("Name: ", { style: { fg: colors.gray } }), ui.text(display.name ?? "-")]),
		ui.row({}, [ui.text("Email: ", { style: { fg: colors.gray } }), ui.text(display.email ?? "-")]),
		ui.row({}, [ui.text("Created: ", { style: { fg: colors.gray } }), ui.text(formatTimestamp(display.created_at))]),
		ui.row({}, [
			ui.text("Env: ", { style: { fg: colors.gray } }),
			ui.text(display.env, { style: { fg: display.env === "live" ? colors.green : colors.yellow } }),
		]),
		...(display.stripe_id ? [ui.row({}, [ui.text("Stripe: ", { style: { fg: colors.gray } }), ui.text(display.stripe_id, { style: { dim: true } })])] : []),
	]));

	// Loading expanded
	if (state.expandedLoading) {
		children.push(ui.column({ mt: 1 }, [loadingText("Loading details...")]));
	}

	// Error loading expanded
	if (state.expandedError) {
		children.push(ui.column({ mt: 1 }, [ui.text("Failed to load details", { style: { fg: colors.red } })]));
	}

	// Expanded sections
	if (expanded) {
		const sections: VNode[] = [];
		sections.push(renderSubscriptionsSection(expanded.subscriptions, "Subscriptions"));

		if (expanded.scheduled_subscriptions.length > 0) {
			sections.push(renderSubscriptionsSection(expanded.scheduled_subscriptions, "Scheduled"));
		}

		const balancesNode = renderBalancesSection(expanded.balances as Record<string, ApiBalance>);
		if (balancesNode) sections.push(balancesNode);

		if (expanded.entities && expanded.entities.length > 0) {
			sections.push(renderEntitiesSection(expanded.entities));
		}

		if (expanded.invoices && expanded.invoices.length > 0) {
			sections.push(renderInvoicesSection(expanded.invoices));
		}

		if (expanded.rewards && expanded.rewards.discounts.length > 0) {
			const rewardsNode = renderRewardsSection(expanded.rewards);
			if (rewardsNode) sections.push(rewardsNode);
		}

		if (expanded.referrals && expanded.referrals.length > 0) {
			const referralsNode = renderReferralsSection(expanded.referrals);
			if (referralsNode) sections.push(referralsNode);
		}

		children.push(ui.column({ mt: 1, gap: 1 }, sections));
	}

	// Fallback subscriptions when not expanded
	if (!expanded && !state.expandedLoading) {
		const subs = customer.subscriptions as Array<{ plan_id?: string; status?: string }>;
		const subItems: VNode[] = [];
		if (subs.length > 0) {
			for (const sub of subs.slice(0, 5)) {
				subItems.push(ui.row({}, [
					ui.text("- ", { style: { fg: colors.gray } }),
					ui.text(sub.plan_id || "Unknown"),
					...(sub.status ? [ui.text(` (${sub.status})`, { style: { fg: sub.status === "active" ? colors.green : colors.yellow } })] : []),
				]));
			}
		} else {
			subItems.push(ui.text("No subscriptions", { style: { dim: true } }));
		}
		children.push(ui.column({ mt: 1 }, [
			ui.text("Subscriptions", { style: { fg: colors.gray, bold: true } }),
			...subItems,
		]));
	}

	// Actions at bottom
	children.push(ui.column({ mt: 1 }, [
		...(state.copiedFeedback
			? [ui.text("Copied!", { style: { fg: colors.green } })]
			: [ui.row({}, [ui.text("[c]", { style: { fg: colors.magenta } }), ui.text(" Copy ID", { style: { fg: colors.gray } })])]),
		ui.row({}, [ui.text("[o]", { style: { fg: colors.magenta } }), ui.text(" Open in Autumn", { style: { fg: colors.gray } })]),
	]));

	return ui.box({ border: "rounded", px: 1, minWidth: 44 }, children);
}

// ─── Main view ───────────────────────────────────────────────────────────────

function renderView(state: CustomersState, environment: AppEnv): VNode {
	// Loading
	if (state.loading && state.customers.length === 0) {
		return ui.column({}, [
			titleBar({ commandName: "atmn customers", version: APP_VERSION }),
			loadingText(`Loading ${environment === AppEnv.Live ? "live" : "sandbox"} customers...`),
			renderBottomBar(state),
		]);
	}

	// Error
	if (state.error && state.customers.length === 0) {
		return ui.column({}, [
			titleBar({ commandName: "atmn customers", version: APP_VERSION }),
			errorView(state.error, { onRetry: true }),
			renderBottomBar(state),
		]);
	}

	// Empty
	if (state.customers.length === 0 && !state.fetching) {
		return ui.column({}, [
			titleBar({
				commandName: "atmn customers",
				version: APP_VERSION,
				searchQuery: state.searchQuery || undefined,
			}),
			emptyView(
				state.searchQuery ? `No results for "${state.searchQuery}"` : "No customers found",
				state.searchQuery ? undefined : "Create customers via the API or Autumn dashboard",
				state.searchQuery || undefined,
			),
			renderBottomBar(state),
		]);
	}

	// Data view
	const pagination = getPaginationDisplay(state.page, state.customers.length, PAGE_SIZE, state.hasMore);

	const tableNode = ui.table({
		id: "customers-table",
		columns: [
			{ key: "id", header: "ID", flex: 1 },
			{ key: "name", header: "Name", flex: 1 },
			{ key: "email", header: "Email", flex: 1 },
			{ key: "created_at", header: "Created", width: 14 },
		],
		data: state.customers.map((c) => ({
			id: c.id,
			name: c.name ?? "-",
			email: c.email ?? "-",
			created_at: formatTimestamp(c.created_at),
		})),
		getRowKey: (row) => row.id,
		selection: state.customers[state.selectedIndex] ? [state.customers[state.selectedIndex].id] : [],
		selectionMode: "single",
		onSelectionChange: () => {},
		onRowPress: () => {},
	});

	// Search overlay
	const searchOverlay = state.searchOpen
		? ui.box({ border: "rounded", px: 1 }, [
				ui.row({}, [
					ui.text("Search: ", { style: { fg: colors.magenta } }),
					ui.input({
						id: "customer-search",
						value: state.searchInput,
						onInput: (v: string) => app.update((s) => ({ ...s, searchInput: v })),
					}),
				]),
			])
		: null;

	const mainContent = state.sheetOpen
		? ui.row({ width: "100%" }, [
				ui.column({ flex: 1 }, [tableNode]),
				renderCustomerSheet(state),
			])
		: tableNode;

	const viewChildren: VNode[] = [
		titleBar({
			commandName: "atmn customers",
			version: APP_VERSION,
			paginationText: pagination.text,
			searchQuery: state.searchQuery || undefined,
		}),
		mainContent,
	];

	if (state.fetching && state.customers.length > 0) {
		viewChildren.push(ui.text("Loading...", { style: { fg: colors.yellow } }));
	}

	if (searchOverlay) {
		viewChildren.push(searchOverlay);
	}

	viewChildren.push(renderBottomBar(state));

	return ui.column({ width: "100%" }, viewChildren);
}

function renderBottomBar(state: CustomersState): VNode {
	const pagination = getPaginationDisplay(state.page, state.customers.length, PAGE_SIZE, state.hasMore);

	if (state.focusTarget === "sheet" && state.sheetOpen) {
		return bottomBar([
			{ key: "Tab", label: "focus table" },
			{ key: "Esc", label: "close" },
			{ key: "c", label: "copy ID" },
			{ key: "o", label: "open" },
			{ key: "q", label: "quit" },
		]);
	}

	if (state.searchOpen) {
		return bottomBar([
			{ key: "Enter", label: "search" },
			{ key: "Esc", label: "cancel" },
		]);
	}

	return bottomBar([
		{ key: "↑↓", label: "navigate" },
		{ key: "←", label: "prev page", visible: pagination.canGoPrev },
		{ key: "→", label: "next page", visible: pagination.canGoNext },
		{ key: "Enter", label: "inspect" },
		{ key: "/", label: "search" },
		{ key: "x", label: "clear search", visible: !!state.searchQuery },
		{ key: "r", label: "refresh" },
		{ key: "q", label: "quit" },
	]);
}

// ─── App entry point ─────────────────────────────────────────────────────────

export async function createCustomersApp(opts: {
	environment: AppEnv;
	onExit: () => void;
}): Promise<void> {
	const { environment, onExit } = opts;

	const app = createNodeApp<CustomersState>({ config: { executionMode: "inline" },
		initialState: {
			page: 1,
			selectedIndex: 0,
			customers: [],
			hasMore: false,
			loading: true,
			fetching: false,
			error: null,
			sheetOpen: false,
			focusTarget: "table",
			selectedCustomer: null,
			expandedCustomer: null,
			expandedLoading: false,
			expandedError: null,
			searchOpen: false,
			searchQuery: "",
			searchInput: "",
			copiedFeedback: false,
		},
	});

	// Debounce timer for expanded customer loading
	let expandDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	let copiedFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

	// ─── Data loading ─────────────────────────────────────────────

	async function loadCustomers(page: number, search: string) {
		app.update((s) => ({ ...s, loading: s.customers.length === 0, fetching: true, error: null }));
		try {
			const data = await fetchCustomers(environment, page, search);
			app.update((s) => {
				const newState: CustomersState = {
					...s,
					customers: data.list,
					hasMore: data.has_more,
					loading: false,
					fetching: false,
					selectedIndex: 0,
					selectedCustomer: data.list[0] ?? null,
				};
				return newState;
			});
		} catch (e) {
			const err = e as ApiError;
			const isAuth = err.status === 401;
			app.update((s) => ({
				...s,
				loading: false,
				fetching: false,
				error: isAuth
					? "Authentication failed (401). Run 'atmn login' to re-authenticate."
					: err.message || String(e),
			}));
		}
	}

	async function loadExpandedCustomer(customerId: string) {
		app.update((s) => ({ ...s, expandedLoading: true, expandedError: null, expandedCustomer: null }));
		try {
			const data = await fetchExpandedCustomer(environment, customerId);
			app.update((s) => {
				// Only update if still looking at same customer
				if (s.selectedCustomer?.id === customerId) {
					return { ...s, expandedCustomer: data, expandedLoading: false };
				}
				return s;
			});
		} catch (e) {
			app.update((s) => ({
				...s,
				expandedLoading: false,
				expandedError: (e as Error).message || String(e),
			}));
		}
	}

	function debouncedLoadExpanded(customerId: string) {
		if (expandDebounceTimer) clearTimeout(expandDebounceTimer);
		expandDebounceTimer = setTimeout(() => {
			loadExpandedCustomer(customerId);
		}, 150);
	}

	async function copyToClipboard(text: string) {
		try {
			await clipboard.write(text);
			app.update((s) => ({ ...s, copiedFeedback: true }));
			if (copiedFeedbackTimer) clearTimeout(copiedFeedbackTimer);
			copiedFeedbackTimer = setTimeout(() => {
				app.update((s) => ({ ...s, copiedFeedback: false }));
			}, 1500);
		} catch {
			// Silently fail clipboard copy
		}
	}

	function openInBrowser(customer: ApiCustomer) {
		const envPath = customer.env === "live" ? "" : "/sandbox";
		open(`${AUTUMN_DASHBOARD_URL}${envPath}/customers/${customer.id}`);
	}

	// ─── View ─────────────────────────────────────────────────────

	app.view((state) => renderView(state, environment));

	// ─── Keyboard handling ────────────────────────────────────────

	app.keys({
		"q": () => {
			app.stop();
			onExit();
		},
		"r": (ctx) => {
			const s = ctx.state;
			loadCustomers(s.page, s.searchQuery);
		},
		"/": (ctx) => {
			const s = ctx.state;
			if (s.focusTarget === "search") return;
			app.update((s) => ({ ...s, searchOpen: true, focusTarget: "search", searchInput: "" }));
		},
		"s": (ctx) => {
			const s = ctx.state;
			if (s.focusTarget === "search" || s.focusTarget === "sheet") return;
			app.update((s) => ({ ...s, searchOpen: true, focusTarget: "search", searchInput: "" }));
		},
		"x": (ctx) => {
			const s = ctx.state;
			if (s.searchQuery && s.focusTarget !== "search") {
				app.update((s) => ({ ...s, searchQuery: "", page: 1, selectedIndex: 0 }));
				loadCustomers(1, "");
			}
		},
		"c": (ctx) => {
			const s = ctx.state;
			if (s.focusTarget === "sheet" && s.sheetOpen && s.selectedCustomer) {
				copyToClipboard(s.selectedCustomer.id);
			}
		},
		"o": (ctx) => {
			const s = ctx.state;
			if (s.focusTarget === "sheet" && s.sheetOpen && s.selectedCustomer) {
				openInBrowser(s.selectedCustomer);
			}
		},
		"up": (ctx) => {
			const s = ctx.state;
			if (s.focusTarget === "table" && s.selectedIndex > 0) {
				const newIndex = s.selectedIndex - 1;
				app.update((prev) => ({
					...prev,
					selectedIndex: newIndex,
					selectedCustomer: prev.customers[newIndex] ?? prev.selectedCustomer,
				}));
				// Reload expanded if sheet is open
				if (s.sheetOpen) {
					const customer = s.customers[newIndex] ?? s.selectedCustomer;
					if (customer) debouncedLoadExpanded(customer.id);
				}
			}
		},
		"k": (ctx) => {
			const s = ctx.state;
			if (s.focusTarget === "table" && s.selectedIndex > 0) {
				const newIndex = s.selectedIndex - 1;
				app.update((prev) => ({
					...prev,
					selectedIndex: newIndex,
					selectedCustomer: prev.customers[newIndex] ?? prev.selectedCustomer,
				}));
				if (s.sheetOpen) {
					const customer = s.customers[newIndex] ?? s.selectedCustomer;
					if (customer) debouncedLoadExpanded(customer.id);
				}
			}
		},
		"down": (ctx) => {
			const s = ctx.state;
			if (s.focusTarget === "table" && s.selectedIndex < s.customers.length - 1) {
				const newIndex = s.selectedIndex + 1;
				app.update((prev) => ({
					...prev,
					selectedIndex: newIndex,
					selectedCustomer: prev.customers[newIndex] ?? prev.selectedCustomer,
				}));
				if (s.sheetOpen) {
					const customer = s.customers[newIndex] ?? s.selectedCustomer;
					if (customer) debouncedLoadExpanded(customer.id);
				}
			}
		},
		"j": (ctx) => {
			const s = ctx.state;
			if (s.focusTarget === "table" && s.selectedIndex < s.customers.length - 1) {
				const newIndex = s.selectedIndex + 1;
				app.update((prev) => ({
					...prev,
					selectedIndex: newIndex,
					selectedCustomer: prev.customers[newIndex] ?? prev.selectedCustomer,
				}));
				if (s.sheetOpen) {
					const customer = s.customers[newIndex] ?? s.selectedCustomer;
					if (customer) debouncedLoadExpanded(customer.id);
				}
			}
		},
		"left": (ctx) => {
			const s = ctx.state;
			if (s.focusTarget === "table") {
				const pagination = getPaginationDisplay(s.page, s.customers.length, PAGE_SIZE, s.hasMore);
				if (pagination.canGoPrev) {
					const newPage = s.page - 1;
					app.update((s) => ({ ...s, page: newPage, selectedIndex: 0 }));
					loadCustomers(newPage, s.searchQuery);
				}
			}
		},
		"right": (ctx) => {
			const s = ctx.state;
			if (s.focusTarget === "table") {
				const pagination = getPaginationDisplay(s.page, s.customers.length, PAGE_SIZE, s.hasMore);
				if (pagination.canGoNext) {
					const newPage = s.page + 1;
					app.update((s) => ({ ...s, page: newPage, selectedIndex: 0 }));
					loadCustomers(newPage, s.searchQuery);
				}
			}
		},
		"return": (ctx) => {
			const s = ctx.state;
			if (s.focusTarget === "search" && s.searchOpen) {
				const query = s.searchInput.trim();
				app.update((s) => ({
					...s,
					searchOpen: false,
					searchQuery: query,
					focusTarget: "table",
					page: 1,
					selectedIndex: 0,
				}));
				loadCustomers(1, query);
				return;
			}
			if (s.focusTarget === "table" && s.customers[s.selectedIndex]) {
				const customer = s.customers[s.selectedIndex];
				app.update((s) => ({
					...s,
					sheetOpen: true,
					focusTarget: "sheet",
					selectedCustomer: customer,
					expandedCustomer: null,
					expandedLoading: false,
					expandedError: null,
				}));
				debouncedLoadExpanded(customer.id);
			}
		},
		"escape": (ctx) => {
			const s = ctx.state;
			if (s.searchOpen) {
				app.update((s) => ({ ...s, searchOpen: false, focusTarget: "table" }));
				return;
			}
			if (s.sheetOpen) {
				app.update((s) => ({ ...s, sheetOpen: false, focusTarget: "table" }));
			}
		},
		"tab": (ctx) => {
			const s = ctx.state;
			if (s.sheetOpen) {
				app.update((s) => ({
					...s,
					focusTarget: s.focusTarget === "table" ? "sheet" : "table",
				}));
			}
		},
	});

	// ─── Start and load ───────────────────────────────────────────

	await app.start();
	await loadCustomers(1, "");
}
