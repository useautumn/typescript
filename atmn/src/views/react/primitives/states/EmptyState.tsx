export interface EmptyStateProps {
	title: string;
	description?: string;
	searchQuery?: string;
}

/**
 * Generic empty state with customizable content
 */
export function EmptyState({
	title,
	description,
	searchQuery,
}: EmptyStateProps) {
	if (searchQuery) {
		return (
			<box
				flexDirection="column"
				border
				borderStyle="rounded"
				borderColor="#888888"
				paddingX={2}
				paddingY={1}
				width="100%"
				alignItems="center"
				justifyContent="center"
			>
				<box marginTop={1}>
					<b>
						<text content={`No results for "${searchQuery}"`} />
					</b>
				</box>
				<box marginTop={1}>
					<text style={{ fg: "#666666" }}>
						{"Try a different search term or press "}
						<span fg="#FF00FF">x</span>
						{" to clear the search."}
					</text>
				</box>
			</box>
		);
	}

	return (
		<box
			flexDirection="column"
			border
			borderStyle="rounded"
			borderColor="#888888"
			paddingX={2}
			paddingY={1}
			width="100%"
			alignItems="center"
			justifyContent="center"
		>
			<box marginTop={1}>
				<b>
					<text content={title} />
				</b>
			</box>
			{description && (
				<box marginTop={1}>
					<text content={description} style={{ fg: "#666666" }} />
				</box>
			)}
		</box>
	);
}
