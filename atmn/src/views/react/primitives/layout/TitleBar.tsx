export interface TitleBarItem {
	label: string;
	value: string;
	color?: string; // Text color for value (default: "white")
}

export interface TitleBarProps {
	/** The command name to display (e.g., "atmn customers") */
	commandName: string;
	/** Optional version string */
	version?: string;
	/** Pagination display text (e.g., "Page 1 of many") */
	paginationText?: string;
	/** Active search query to display */
	searchQuery?: string;
	/** Additional items to display */
	extraItems?: TitleBarItem[];
}

/**
 * Generic title bar for list views with round border, showing version,
 * command name, pagination info, extra items, and search query.
 */
export function TitleBar({
	commandName,
	version,
	paginationText,
	searchQuery,
	extraItems,
}: TitleBarProps) {
	return (
		<box
			border
			borderStyle="rounded"
			borderColor="#888888"
			paddingX={1}
			width="100%"
			justifyContent="center"
		>
			<text>
				{version && (
					<>
						<span fg="#888888">{version}</span>
						<span fg="#888888"> │ </span>
					</>
				)}
				<b>
					<span fg="white">{commandName}</span>
				</b>
				{paginationText && (
					<>
						<span fg="#888888"> │ </span>
						<span fg="#888888">{paginationText}</span>
					</>
				)}
				{extraItems?.map((item) => (
					<span key={`${item.label}-${item.value}`}>
						<span fg="#888888"> │ </span>
						<span fg="#888888">{item.label}: </span>
						<span fg={item.color ?? "white"}>{item.value}</span>
					</span>
				))}
				{searchQuery && (
					<>
						<span fg="#888888"> │ </span>
						<span fg="#FF00FF">search: </span>
						<span fg="white">{searchQuery}</span>
						<span fg="#888888"> (x to clear)</span>
					</>
				)}
			</text>
		</box>
	);
}
