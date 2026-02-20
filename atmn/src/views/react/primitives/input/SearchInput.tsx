import { useKeyboard } from "../../../../lib/tui/ink-compat.js";
import { useState } from "react";

export interface SearchInputProps {
	/** Initial search value */
	initialValue?: string;
	/** Placeholder text */
	placeholder?: string;
	/** Called when search is submitted (Enter pressed) */
	onSubmit: (query: string) => void;
	/** Called when search is cancelled (Escape pressed) */
	onCancel: () => void;
}

/**
 * Inline search input with submit/cancel keyboard handling
 */
export function SearchInput({
	initialValue = "",
	placeholder = "Search...",
	onSubmit,
	onCancel,
}: SearchInputProps) {
	const [value, setValue] = useState(initialValue);

	useKeyboard((key: { name?: string }) => {
		if (key.name === "escape") {
			onCancel();
			return;
		}
	});

	const handleSubmit = (submittedValue: string) => {
		onSubmit(submittedValue.trim());
	};

	return (
		<box
			border
			borderStyle="rounded"
			borderColor="#FF00FF"
			paddingX={1}
			width="100%"
		>
			<text content="Search: " style={{ fg: "#FF00FF" }} />
			<input
				value={value}
				onInput={setValue}
				onSubmit={handleSubmit}
				placeholder={placeholder}
				focused
			/>
		</box>
	);
}
