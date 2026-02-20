import { Spinner } from "./Spinner.js";

interface LoadingTextProps {
	text: string;
}

/**
 * Shows a spinner with text
 */
export function LoadingText({ text }: LoadingTextProps) {
	return (
		<box flexDirection="row">
			<Spinner color="#FF00FF" />
			<text content={` ${text}`} style={{ fg: "#FF00FF" }} />
		</box>
	);
}
