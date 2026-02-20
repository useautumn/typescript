/**
 * Shared Rezi view helpers for atmn CLI
 */
import { ui, rgb, type VNode } from "@rezi-ui/core";

// Named color palette matching Ink's named colors
export const colors = {
	red: rgb(255, 80, 80),
	green: rgb(80, 200, 80),
	yellow: rgb(255, 200, 50),
	magenta: rgb(200, 100, 255),
	cyan: rgb(80, 200, 255),
	gray: rgb(128, 128, 128),
	white: rgb(255, 255, 255),
	dim: rgb(100, 100, 100),
} as const;

/**
 * Bordered card with title (replaces Card component)
 */
export function card(title: string, children: VNode[], opts?: { borderColor?: ReturnType<typeof rgb>; width?: number }): VNode {
	return ui.box(
		{
			border: "rounded",
			px: 1,
			width: opts?.width,
		},
		[
			ui.text(title, { style: { fg: opts?.borderColor ?? colors.magenta, bold: true } }),
			...(children.length > 0 ? [ui.column({ gap: 0, mt: 1 }, children)] : []),
		],
	);
}

/**
 * Prompt card with select options
 */
export function promptCard(
	title: string,
	content: VNode[],
	selectProps: { id: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void },
): VNode {
	return ui.box(
		{ border: "rounded", px: 1 },
		[
			ui.text(title, { style: { fg: colors.yellow, bold: true } }),
			ui.column({ gap: 0, mt: 1 }, content),
			ui.select({
				id: selectProps.id,
				value: selectProps.value,
				options: selectProps.options,
				onChange: selectProps.onChange,
			}),
		],
	);
}

/**
 * Key-value display line
 */
export function keyValue(label: string, value: string): VNode {
	return ui.row({ gap: 1 }, [
		ui.text(`${label}:`, { style: { fg: colors.gray } }),
		ui.text(value),
	]);
}

/**
 * Loading text with spinner
 */
export function loadingText(text: string): VNode {
	return ui.spinner({ variant: "dots", label: text });
}

/**
 * Title bar for list views
 */
export function titleBar(props: {
	commandName: string;
	version?: string;
	paginationText?: string;
	searchQuery?: string;
	extraItems?: { label: string; value: string; color?: ReturnType<typeof rgb> }[];
}): VNode {
	const parts: VNode[] = [];

	if (props.version) {
		parts.push(ui.text(props.version, { style: { fg: colors.gray } }));
		parts.push(ui.text(" │ ", { style: { fg: colors.gray } }));
	}

	parts.push(ui.text(props.commandName, { style: { bold: true } }));

	if (props.paginationText) {
		parts.push(ui.text(" │ ", { style: { fg: colors.gray } }));
		parts.push(ui.text(props.paginationText, { style: { fg: colors.gray } }));
	}

	if (props.extraItems) {
		for (const item of props.extraItems) {
			parts.push(ui.text(" │ ", { style: { fg: colors.gray } }));
			parts.push(ui.text(`${item.label}: `, { style: { fg: colors.gray } }));
			parts.push(ui.text(item.value, { style: { fg: item.color ?? colors.white } }));
		}
	}

	if (props.searchQuery) {
		parts.push(ui.text(" │ ", { style: { fg: colors.gray } }));
		parts.push(ui.text("search: ", { style: { fg: colors.magenta } }));
		parts.push(ui.text(props.searchQuery));
		parts.push(ui.text(" (x to clear)", { style: { fg: colors.gray } }));
	}

	return ui.box({ border: "rounded", px: 1, width: "100%" }, [
		ui.row({}, parts),
	]);
}

/**
 * Bottom bar with keybind hints
 */
export function bottomBar(hints: { key: string; label: string; visible?: boolean }[]): VNode {
	const visible = hints.filter((h) => h.visible !== false);
	const parts: VNode[] = [];

	for (let i = 0; i < visible.length; i++) {
		if (i > 0) {
			parts.push(ui.text(" │ ", { key: `sep-${i}`, style: { fg: colors.gray } }));
		}
		parts.push(ui.text(visible[i].key, { key: `key-${i}`, style: { fg: colors.magenta } }));
		parts.push(ui.text(` ${visible[i].label}`, { key: `lbl-${i}`, style: { fg: colors.gray } }));
	}

	return ui.box({ border: "rounded", px: 1, width: "100%" }, [
		ui.row({}, parts),
	]);
}

/**
 * Error state view
 */
export function errorView(error: string, opts?: { onRetry?: boolean }): VNode {
	const children: VNode[] = [
		ui.text("Error", { style: { fg: colors.red, bold: true } }),
		ui.text(error, { style: { dim: true } }),
	];

	if (opts?.onRetry) {
		children.push(
			ui.row({ gap: 0, mt: 1 }, [
				ui.text("Press "),
				ui.text("r", { style: { fg: colors.magenta } }),
				ui.text(" to retry or "),
				ui.text("q", { style: { fg: colors.magenta } }),
				ui.text(" to quit"),
			]),
		);
	} else {
		children.push(
			ui.row({ gap: 0, mt: 1 }, [
				ui.text("Press "),
				ui.text("q", { style: { fg: colors.magenta } }),
				ui.text(" to quit"),
			]),
		);
	}

	return ui.box({ border: "rounded", px: 1, width: "100%" }, children);
}

/**
 * Empty state view
 */
export function emptyView(title: string, description?: string, searchQuery?: string): VNode {
	const children: VNode[] = [];

	if (searchQuery) {
		children.push(ui.text(`No results for "${searchQuery}"`, { style: { bold: true } }));
		children.push(
			ui.row({}, [
				ui.text("Try a different search term or press ", { style: { dim: true } }),
				ui.text("x", { style: { fg: colors.magenta } }),
				ui.text(" to clear the search.", { style: { dim: true } }),
			]),
		);
	} else {
		children.push(ui.text(title, { style: { bold: true } }));
		if (description) {
			children.push(ui.text(description, { style: { dim: true } }));
		}
	}

	return ui.box({ border: "rounded", px: 1, py: 1, width: "100%" }, [
		ui.column({ gap: 1 }, children),
	]);
}

/**
 * Status icon for push/pull operations
 */
export function statusIcon(status: "pending" | "loading" | "success" | "warning" | "error" | "skipped"): VNode {
	switch (status) {
		case "pending":
			return ui.text(" ", { style: { dim: true } });
		case "loading":
			return ui.spinner({ variant: "dots" });
		case "success":
			return ui.text("✓", { style: { fg: colors.green } });
		case "warning":
			return ui.text("⚠", { style: { fg: colors.yellow } });
		case "error":
			return ui.text("✗", { style: { fg: colors.red } });
		case "skipped":
			return ui.text("⊘", { style: { fg: colors.gray } });
	}
}

/**
 * Status row with icon and label
 */
export function statusRow(
	status: "pending" | "loading" | "success" | "warning" | "error" | "skipped",
	label: string,
	detail?: string,
	action?: string,
): VNode {
	const parts: VNode[] = [statusIcon(status), ui.text(` ${label}`)];

	if (detail) {
		parts.push(ui.text(` ${detail}`, { style: { fg: colors.gray } }));
	}

	if (action) {
		const actionColor = action === "skipped" || action === "unchanged" ? colors.gray : colors.green;
		parts.push(ui.text(` (${action})`, { style: { fg: actionColor } }));
	}

	return ui.row({}, parts);
}

/**
 * Step header for multi-step flows
 */
export function stepHeader(step: number, totalSteps: number, title: string): VNode {
	return ui.column({}, [
		ui.row({ gap: 1 }, [
			ui.text(`Step ${step}/${totalSteps}:`, { style: { fg: colors.magenta, bold: true } }),
			ui.text(title, { style: { bold: true } }),
		]),
		ui.text("─".repeat(`Step ${step}/${totalSteps}:`.length), { style: { fg: colors.magenta } }),
	]);
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string): string {
	try {
		const d = new Date(dateStr);
		return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
	} catch {
		return dateStr;
	}
}

/**
 * Get pagination display text
 */
export function getPaginationDisplay(
	page: number,
	count: number,
	pageSize: number,
	hasMore: boolean,
): { text: string; canGoPrev: boolean; canGoNext: boolean } {
	const start = (page - 1) * pageSize + 1;
	const end = start + count - 1;
	const text = count > 0 ? `${start}-${end}${hasMore ? "+" : ""}` : "No items";
	return {
		text: `Page ${page} (${text})`,
		canGoPrev: page > 1,
		canGoNext: hasMore,
	};
}
