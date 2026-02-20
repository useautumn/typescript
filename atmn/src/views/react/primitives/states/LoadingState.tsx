import { Spinner } from "../../components/Spinner.js";

export interface LoadingStateProps {
	message?: string;
}

/**
 * Generic loading state with spinner
 */
export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
	return (
		<box
			flexDirection="column"
			border
			borderStyle="rounded"
			borderColor="#888888"
			paddingX={2}
			paddingY={1}
			width="100%"
		>
			<box flexDirection="row">
				<Spinner color="#FF00FF" />
				<text content={` ${message}`} />
			</box>
		</box>
	);
}
