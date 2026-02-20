export interface DetailSheetProps {
	/** Title to display at top of sheet */
	title: string;
	/** Optional subtitle */
	subtitle?: string;
	/** Whether the sheet has focus */
	isFocused: boolean;
	/** Content to render inside the sheet */
	children: React.ReactNode;
	/** Optional actions to show at bottom */
	actions?: React.ReactNode;
	/** Optional minimum width (default: 44) */
	minWidth?: number;
}

/**
 * Generic sidebar container component for detail views.
 * Provides consistent styling and layout structure.
 *
 * Pattern frozen from working CustomerSheet/ProductSheet/FeatureSheet.
 * Uses height="100%" and lets flexbox handle layout (no pixel calculations).
 */
export function DetailSheet({
	title,
	subtitle,
	isFocused,
	children,
	actions,
	minWidth = 44,
}: DetailSheetProps) {
	const borderColor = isFocused ? "#FF00FF" : "#888888";

	return (
		<box
			flexDirection="column"
			border
			borderStyle="rounded"
			borderColor={borderColor}
			paddingX={1}
			minWidth={minWidth}
			height="100%"
		>
			{/* Title */}
			<b>
				<text content={title} style={{ fg: "white" }} />
			</b>

			{/* Subtitle */}
			{subtitle && (
				<text content={subtitle} style={{ fg: "#888888" }} />
			)}

			{/* Content */}
			{children}

			{/* Spacer to push actions to bottom */}
			<box flexGrow={1} />

			{/* Actions - pinned to bottom */}
			{actions && <box flexDirection="column">{actions}</box>}
		</box>
	);
}
