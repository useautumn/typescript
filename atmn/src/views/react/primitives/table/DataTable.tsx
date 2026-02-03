import { Box } from "ink";
import { ScrollList, type ScrollListRef } from "ink-scroll-list";
import { useEffect, useMemo, useRef, useState } from "react";
import { TableHeader, TableRow } from "./TableRow.js";
import type { Column } from "./index.js";

/**
 * Props for the DataTable component
 */
export interface DataTableProps<T> {
	/** Data items to display */
	data: T[];
	/** Column definitions */
	columns: Column<T>[];
	/** Currently selected row index */
	selectedIndex: number;
	/** Callback when row is selected */
	onSelect: (item: T, index: number) => void;
	/** Whether the table has focus */
	isFocused: boolean;
	/** Function to get unique key for each item */
	keyExtractor: (item: T) => string;
	/** Optional: reserved width for adjacent elements (like sidebar) */
	reservedWidth?: number;
}

// Row overhead: marker (2) + column margins (1 per column after first)
// Table overhead: border left (1) + border right (1) + paddingX (2) = 4
const TABLE_OVERHEAD = 6;
const MIN_COLUMN_WIDTH = 8;
const SAMPLE_SIZE = 50;

/**
 * Calculate column widths based on actual data content.
 * Shows full content by default, only truncates if total row width exceeds available space.
 *
 * @param data - Array of items to measure
 * @param columns - Column definitions with render functions
 * @param terminalWidth - Available terminal width
 * @param reservedWidth - Width reserved for other elements
 */
function calculateColumnWidths<T>(
	data: T[],
	columns: Column<T>[],
	terminalWidth: number,
	reservedWidth: number = 0,
): number[] {
	// Calculate available width for table content
	const columnMargins = Math.max(0, columns.length - 1); // 1 margin between each column
	const markerWidth = 2; // "▸ " or "  "
	const availableWidth =
		terminalWidth - TABLE_OVERHEAD - reservedWidth - columnMargins - markerWidth;

	// Sample data (first N items) to measure content widths
	const sampleData = data.slice(0, SAMPLE_SIZE);

	// Find maximum content width for each column
	const maxWidths = columns.map((column) => {
		// Start with header length as minimum
		let maxLen = column.header.length;

		// Measure actual content
		for (const item of sampleData) {
			const content = column.render(item, false);
			if (typeof content === "string") {
				maxLen = Math.max(maxLen, content.length);
			}
		}

		// Apply column's minWidth if specified
		if (column.minWidth) {
			maxLen = Math.max(maxLen, column.minWidth);
		}

		return maxLen;
	});

	// Total width needed to show all content
	const totalContentWidth = maxWidths.reduce((sum, w) => sum + w, 0);

	// If everything fits, use actual content widths (no truncation)
	if (totalContentWidth <= availableWidth) {
		return maxWidths;
	}

	// Need to truncate - distribute available space proportionally
	const ratio = availableWidth / totalContentWidth;

	return maxWidths.map((width) => {
		const proportionalWidth = Math.floor(width * ratio);
		return Math.max(MIN_COLUMN_WIDTH, proportionalWidth);
	});
}

/**
 * Generic scrollable data table component.
 * Uses ink-scroll-list for virtualized scrolling.
 */
export function DataTable<T>({
	data,
	columns,
	selectedIndex,
	onSelect,
	isFocused,
	keyExtractor,
	reservedWidth = 0,
}: DataTableProps<T>) {
	const listRef = useRef<ScrollListRef>(null);
	const [terminalWidth, setTerminalWidth] = useState(process.stdout.columns);

	// Handle terminal resize
	useEffect(() => {
		const handleResize = () => {
			setTerminalWidth(process.stdout.columns);
			listRef.current?.remeasure();
		};

		process.stdout.on("resize", handleResize);
		return () => {
			process.stdout.off("resize", handleResize);
		};
	}, []);

	// Calculate column widths based on data and terminal width
	const columnWidths = useMemo(
		() => calculateColumnWidths(data, columns, terminalWidth, reservedWidth),
		[data, columns, terminalWidth, reservedWidth],
	);

	return (
		<Box flexDirection="column" flexGrow={1}>
			<TableHeader columns={columns} columnWidths={columnWidths} />
			<Box flexDirection="column" flexGrow={1}>
				<ScrollList ref={listRef} selectedIndex={selectedIndex}>
					{data.map((item, index) => (
						<TableRow
							key={keyExtractor(item)}
							item={item}
							columns={columns}
							isSelected={index === selectedIndex}
							isFocused={isFocused}
							columnWidths={columnWidths}
						/>
					))}
				</ScrollList>
			</Box>
		</Box>
	);
}
