export interface KeybindHint {
	/** The key or key combination (e.g., "↑↓", "Enter", "q") */
	key: string;
	/** Description of what the key does (e.g., "navigate", "select", "quit") */
	label: string;
	/** Only show this hint if condition is true (default: true) */
	visible?: boolean;
}

export interface BottomBarProps {
	/** Array of keyboard hints to display */
	hints: KeybindHint[];
}

/**
 * Generic keyboard hints bar for list views with round border.
 * Displays keybinds with pipe separators.
 */
export function BottomBar({ hints }: BottomBarProps) {
	const visibleHints = hints.filter((hint) => hint.visible !== false);

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
				{visibleHints.map((hint, index) => (
					<span key={`${hint.key}-${hint.label}`}>
						{index > 0 && <span fg="#888888">│ </span>}
						<span fg="#FF00FF">{hint.key}</span>
						<span fg="#888888"> {hint.label} </span>
					</span>
				))}
			</text>
		</box>
	);
}
