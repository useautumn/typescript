import { Spinner } from "./Spinner.js";

interface StatusLineProps {
	status: "pending" | "loading" | "success" | "error";
	message: string;
	detail?: string;
}

export function StatusLine({ status, message, detail }: StatusLineProps) {
	const renderIcon = () => {
		switch (status) {
			case "pending":
				return <text content="○" style={{ fg: "#666666" }} />;
			case "loading":
				return <Spinner color="#FF00FF" />;
			case "success":
				return <text content="✓" style={{ fg: "green" }} />;
			case "error":
				return <text content="✗" style={{ fg: "red" }} />;
		}
	};

	return (
		<box flexDirection="row">
			{renderIcon()}
			<text content={` ${message}`} />
			{detail && <text content={` (${detail})`} style={{ fg: "#666666" }} />}
		</box>
	);
}
