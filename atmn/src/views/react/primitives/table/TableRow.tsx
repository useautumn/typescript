import { Box, Text } from "ink";
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
	const markerColor = isSelected && isFocused ? "magenta" : "gray";

	return (
		<Box>
			<Text color={markerColor}>{marker}</Text>
			{columns.map((column, index) => {
				const width = columnWidths[index] ?? 10;
				const content = column.render(item, isSelected);

				// If content is a string, handle truncation and styling
				if (typeof content === "string") {
					const truncated = truncate(content, width - 1);
					return (
						<Box key={column.key} width={width} marginLeft={index > 0 ? 1 : 0}>
							<Text bold={isSelected} dimColor={!isSelected}>
								{truncated}
							</Text>
						</Box>
					);
				}

				// If content is a React node, render it directly
				return (
					<Box key={column.key} width={width} marginLeft={index > 0 ? 1 : 0}>
						{content}
					</Box>
				);
			})}
		</Box>
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
		<Box marginBottom={0}>
			<Text color="gray">{"  "}</Text>
			{columns.map((column, index) => {
				const width = columnWidths[index] ?? 10;
				return (
					<Box key={column.key} width={width} marginLeft={index > 0 ? 1 : 0}>
						<Text color="gray" bold>
							{column.header}
						</Text>
					</Box>
				);
			})}
		</Box>
	);
}
