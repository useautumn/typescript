import { truncate } from "../utils/truncate.js";
import type { Column } from "./index.js";

/**
 * Props for the TableRow component
 */
export interface TableRowProps<T> {
	/** The data item to render */
	item: T;
	/** Column definitions */
	columns: Column<T>[];
	/** Whether this row is selected */
	isSelected: boolean;
	/** Whether the table has focus */
	isFocused: boolean;
	/** Calculated widths for each column */
	columnWidths: number[];
}

/**
 * Generic table row component.
 * Renders a single row with selection marker and column content.
 */
export function TableRow<T>({
	item,
	columns,
	isSelected,
	isFocused,
	columnWidths,
}: TableRowProps<T>) {
	const marker = isSelected ? "▸ " : "  ";
	const markerColor = isSelected && isFocused ? "#FF00FF" : "#888888";

	return (
		<box flexDirection="row">
			<text content={marker} style={{ fg: markerColor }} />
			{columns.map((column, index) => {
				const width = columnWidths[index] ?? 10;
				const content = column.render(item, isSelected);

				// If content is a string, truncate and style it
				if (typeof content === "string") {
					const truncated = truncate(content, width);
					const padded = truncated.padEnd(width);
					return (
						<box key={column.key} width={width} marginLeft={index > 0 ? 1 : 0}>
							{isSelected ? (
								<b>
									<text content={padded} />
								</b>
							) : (
								<text content={padded} style={{ fg: "#AAAAAA" }} />
							)}
						</box>
					);
				}

				// If content is a React node, render it directly
				return (
					<box key={column.key} width={width} marginLeft={index > 0 ? 1 : 0}>
						{content}
					</box>
				);
			})}
		</box>
	);
}

/**
 * Props for the TableHeader component
 */
export interface TableHeaderProps<T> {
	/** Column definitions */
	columns: Column<T>[];
	/** Calculated widths for each column */
	columnWidths: number[];
}

/**
 * Generic table header component.
 * Renders column headers with proper widths.
 */
export function TableHeader<T>({
	columns,
	columnWidths,
}: TableHeaderProps<T>) {
	return (
		<box marginBottom={0} flexDirection="row">
			<text content="  " style={{ fg: "#888888" }} />
			{columns.map((column, index) => {
				const width = columnWidths[index] ?? 10;
				const padded = column.header.padEnd(width);
				return (
					<box key={column.key} width={width} marginLeft={index > 0 ? 1 : 0}>
						<b>
							<text content={padded} style={{ fg: "#888888" }} />
						</b>
					</box>
				);
			})}
		</box>
	);
}
