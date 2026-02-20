interface KeyValueProps {
	label: string;
	value: string;
}

/**
 * Displays a key-value pair with styled label
 */
export function KeyValue({ label, value }: KeyValueProps) {
	return (
		<text>
			<span fg="#888888">{label}:</span> {value}
		</text>
	);
}
