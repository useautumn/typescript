/**
 * Wrapper around OpenTUI select for consistent styling
 */

export interface SelectMenuItem<V = string> {
	label: string;
	value: V;
	disabled?: boolean;
}

export interface SelectMenuProps<V = string> {
	items: SelectMenuItem<V>[];
	onSelect: (item: SelectMenuItem<V>) => void;
}

export function SelectMenu<V = string>({
	items,
	onSelect,
}: SelectMenuProps<V>) {
	const selectOptions = items.map((item) => ({
		name: item.label,
	}));

	const handleSelect = (
		_index: number,
		option: { name: string } | null,
	) => {
		if (option) {
			const matched = items.find((item) => item.label === option.name);
			if (matched) {
				onSelect(matched);
			}
		}
	};

	return (
		<select options={selectOptions} onSelect={handleSelect} focused />
	);
}
