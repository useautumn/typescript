export interface ErrorStateProps {
	error: Error;
	onRetry?: () => void;
}

/**
 * Generic error state with retry hint
 */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
	return (
		<box
			flexDirection="column"
			border
			borderStyle="rounded"
			borderColor="red"
			paddingX={2}
			paddingY={1}
			width="100%"
		>
			<box>
				<b>
					<text content="Error" style={{ fg: "red" }} />
				</b>
			</box>
			<box marginTop={1}>
				<text content={error.message} style={{ fg: "#666666" }} />
			</box>
			<box marginTop={1}>
				<text>
					{onRetry && (
						<>
							{"Press "}
							<span fg="#FF00FF">r</span>
							{" to retry or "}
						</>
					)}
					{"Press "}
					<span fg="#FF00FF">q</span>
					{" to quit"}
				</text>
			</box>
		</box>
	);
}
