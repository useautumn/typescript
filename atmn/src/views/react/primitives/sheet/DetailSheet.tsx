import { Box, Text } from "ink";
import Spinner from "ink-spinner";

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
	/** Whether to show loading spinner */
	isLoading?: boolean;
	/** Error to display */
	error?: Error | null;
}

/**
 * Generic sidebar container component for detail views.
 * Provides consistent styling, loading/error states, and layout structure.
 */
export function DetailSheet({
	title,
	subtitle,
	isFocused,
	children,
	actions,
	minWidth = 44,
	isLoading,
	error,
}: DetailSheetProps) {
	const borderColor = isFocused ? "magenta" : "gray";

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor={borderColor}
			paddingX={1}
			flexShrink={0}
			minWidth={minWidth}
		>
			{/* Title */}
			<Text bold color="white">
				{title}
			</Text>

			{/* Subtitle */}
			{subtitle && <Text color="gray">{subtitle}</Text>}

			{/* Divider */}
			<Box marginTop={1}>
				<Text color="gray">{"─".repeat(minWidth - 4)}</Text>
			</Box>

			{/* Loading state */}
			{isLoading && (
				<Box marginTop={1}>
					<Text color="magenta">
						<Spinner type="dots" />
					</Text>
					<Text> Loading...</Text>
				</Box>
			)}

			{/* Error state */}
			{error && (
				<Box marginTop={1}>
					<Text color="red">{error.message || "An error occurred"}</Text>
				</Box>
			)}

			{/* Content */}
			{!isLoading && !error && children}

			{/* Spacer to push actions to bottom */}
			<Box flexGrow={1} />

			{/* Actions */}
			{actions && <Box flexDirection="column">{actions}</Box>}
		</Box>
	);
}
