export interface SheetSectionProps {
	/** Section title */
	title: string;
	/** Content to render */
	children: React.ReactNode;
	/** Optional: show "empty" message if no children */
	emptyMessage?: string;
	/** Whether section is empty (to show emptyMessage) */
	isEmpty?: boolean;
}

/**
 * Generic section container for grouping related info within a sheet.
 */
export function SheetSection({
	title,
	children,
	emptyMessage,
	isEmpty,
}: SheetSectionProps) {
	return (
		<box flexDirection="column" marginTop={1}>
			<b>
				<text content={title} style={{ fg: "#888888" }} />
			</b>
			{isEmpty && emptyMessage ? (
				<text content={emptyMessage} style={{ fg: "#666666" }} />
			) : (
				children
			)}
		</box>
	);
}
