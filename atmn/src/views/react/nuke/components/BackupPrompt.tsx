import { Box, Text, useInput } from "ink";
import React, { useState } from "react";

interface BackupPromptProps {
	onChoice: (createBackup: boolean) => void;
}

/**
 * Backup prompt screen
 * User can choose to create backup or skip
 */
export function BackupPrompt({ onChoice }: BackupPromptProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);

	const options = [
		{ label: "Yes, create backup (recommended)", value: true },
		{ label: "No, skip backup", value: false },
	];

	useInput((input, key) => {
		if (key.upArrow) {
			setSelectedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
		} else if (key.downArrow) {
			setSelectedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
		} else if (key.return) {
			onChoice(options[selectedIndex]!.value);
		} else if (input.toLowerCase() === 'y') {
			onChoice(true);
		} else if (input.toLowerCase() === 'n') {
			onChoice(false);
		}
	});

	return (
		<Box flexDirection="column" padding={1}>
			<Box borderStyle="single" borderColor="magenta" padding={1}>
				<Box flexDirection="column">
					<Text bold color="magenta">💾 Backup Configuration</Text>
					<Box height={1} />
					<Text>Would you like to backup your config?</Text>
					<Text dimColor>(Highly recommended)</Text>
					<Box height={1} />
					<Text dimColor>Backup location:</Text>
					<Text dimColor>→ ./autumn.config.ts.backup</Text>
					<Box height={1} />

					{options.map((option, index) => (
						<Text key={option.label}>
							{selectedIndex === index ? (
								<Text color="magenta">❯ {option.label}</Text>
							) : (
								<Text dimColor>  {option.label}</Text>
							)}
						</Text>
					))}

					<Box height={1} />
					<Text dimColor>↑↓ Navigate • Enter to select • <Text bold>(Y)</Text> Yes • <Text bold>(N)</Text> No</Text>
				</Box>
			</Box>
		</Box>
	);
}
