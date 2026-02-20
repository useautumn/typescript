import { Spinner } from "./Spinner.js";

export type StatusRowStatus =
	| "pending"
	| "loading"
	| "success"
	| "warning"
	| "error"
	| "skipped";

export type StatusRowAction =
	| "created"
	| "updated"
	| "deleted"
	| "archived"
	| "skipped"
	| "unchanged"
	| "versioned";

interface StatusRowProps {
	status: StatusRowStatus;
	label: string;
	detail?: string;
	action?: StatusRowAction;
}

/**
 * Generic status row component with icon indicator
 */
export function StatusRow({ status, label, detail, action }: StatusRowProps) {
	const renderIcon = () => {
		switch (status) {
			case "pending":
				return <text content=" " style={{ fg: "#666666" }} />;
			case "loading":
				return <Spinner color="#FF00FF" />;
			case "success":
				return <text content="✓" style={{ fg: "green" }} />;
			case "warning":
				return <text content="⚠" style={{ fg: "yellow" }} />;
			case "error":
				return <text content="✗" style={{ fg: "red" }} />;
			case "skipped":
				return <text content="⊘" style={{ fg: "#888888" }} />;
			default:
				return <text content=" " />;
		}
	};

	const renderAction = () => {
		if (!action) return null;

		const actionColor =
			action === "skipped" || action === "unchanged" ? "#888888" : "green";
		const dimmed = action === "unchanged";

		return (
			<text
				content={` (${action})`}
				style={{ fg: dimmed ? "#666666" : actionColor }}
			/>
		);
	};

	return (
		<box flexDirection="row">
			{renderIcon()}
			<text content={` ${label}`} />
			{detail && <text content={` ${detail}`} style={{ fg: "#888888" }} />}
			{renderAction()}
		</box>
	);
}
