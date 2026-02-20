import type { ReactNode } from "react";

export type FocusTarget = "main" | "side";

export interface SplitPaneProps {
	/** The main content (typically DataTable) */
	main: ReactNode;
	/** Optional sidebar content (typically DetailSheet) */
	side?: ReactNode;
	/** Which pane has focus */
	focusTarget: FocusTarget;
	/** Whether the sidebar is visible */
	sideOpen: boolean;
	/** Optional: extra content to show below main when loading */
	loadingIndicator?: ReactNode;
}

/**
 * A layout component that displays a main content area alongside an optional sidebar.
 * Handles the visual layout only - no keyboard handling or state management.
 *
 * Pattern matches the working `next` branch: NO height constraints, NO overflow.
 * Pure flexbox layout - content flows naturally.
 */
export function SplitPane({
	main,
	side,
	focusTarget,
	sideOpen,
	loadingIndicator,
}: SplitPaneProps) {
	return (
		<box flexDirection="row" width="100%" flexGrow={1}>
			{/* Main pane - takes remaining space */}
			<box
				flexDirection="column"
				border
				borderStyle="rounded"
				borderColor={focusTarget === "main" ? "#FF00FF" : "#888888"}
				paddingX={1}
				flexGrow={1}
				flexShrink={1}
			>
				{main}
				{loadingIndicator && <box marginTop={1}>{loadingIndicator}</box>}
			</box>

			{/* Side pane - fixed width, doesn't shrink */}
			{sideOpen && side && (
				<box marginLeft={1} flexShrink={0}>
					{side}
				</box>
			)}
		</box>
	);
}
