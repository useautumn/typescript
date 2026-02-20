import { Box } from "../../../../lib/tui/ink-compat.js";
import { useEffect, useState } from "react";
import type { ColumnWidths, CustomersTableProps } from "../types.js";
import { CustomerRow, CustomerTableHeader } from "./CustomerRow.js";

export interface CustomersTableComponentProps extends CustomersTableProps {
	columnWidths: ColumnWidths;
}

/**
 * Customer table with virtual scrolling.
 * Shows a window of visible rows based on terminal height.
 */
export function CustomersTable({
	customers,
	selectedIndex,
	onSelect,
	isFocused,
	columnWidths,
}: CustomersTableComponentProps) {
	const [termHeight, setTermHeight] = useState(process.stdout.rows || 24);

	// Handle terminal resize
	useEffect(() => {
		const handleResize = () => {
			setTermHeight(process.stdout.rows || 24);
		};

		process.stdout.on("resize", handleResize);
		return () => {
			process.stdout.off("resize", handleResize);
		};
	}, []);

	// Update selected customer when index changes
	useEffect(() => {
		if (customers[selectedIndex]) {
			onSelect(customers[selectedIndex], selectedIndex);
		}
	}, [selectedIndex, customers, onSelect]);

	// Virtual scrolling: calculate visible window
	const maxVisibleRows = Math.max(1, termHeight - 8); // Reserve space for header/footer
	const halfWindow = Math.floor(maxVisibleRows / 2);
	let startIndex = Math.max(0, selectedIndex - halfWindow);
	const endIndex = Math.min(customers.length, startIndex + maxVisibleRows);
	// Adjust start if we're near the end
	if (endIndex - startIndex < maxVisibleRows) {
		startIndex = Math.max(0, endIndex - maxVisibleRows);
	}

	const visibleCustomers = customers.slice(startIndex, endIndex);

	return (
		<Box flexDirection="column" flexGrow={1}>
			<CustomerTableHeader columnWidths={columnWidths} />
			<Box flexDirection="column" flexGrow={1}>
				{visibleCustomers.map((customer, i) => {
					const actualIndex = startIndex + i;
					return (
						<CustomerRow
							key={customer.id}
							customer={customer}
							isSelected={actualIndex === selectedIndex}
							isFocused={isFocused}
							columnWidths={columnWidths}
						/>
					);
				})}
			</Box>
		</Box>
	);
}
