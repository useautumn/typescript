import { Box, Text } from "ink";
import React from "react";

interface FinalSummaryProps {
	customers: number;
	plans: number;
	features: number;
	backupPath?: string;
}

/**
 * Final summary screen shown after explosion animation
 * Displays completion stats for user's benefit
 */
export function FinalSummary({
	customers,
	plans,
	features,
	backupPath,
}: FinalSummaryProps) {
	return (
		<Box flexDirection="column" padding={1}>
			<Box borderStyle="single" borderColor="magenta" padding={1}>
				<Box flexDirection="column">
					<Text bold color="magenta">✨ Nuke Complete</Text>
					<Box height={1} />
					<Text color="green">✓ {customers} customers deleted</Text>
					<Text color="green">✓ {plans} plans deleted</Text>
					<Text color="green">✓ {features} features deleted</Text>
					<Box height={1} />
					{backupPath && (
						<>
							<Text dimColor>Backup saved: {backupPath}</Text>
							<Box height={1} />
						</>
					)}
					<Text bold color="magenta">Your sandbox is now empty.</Text>
					<Text dimColor>Ready for a fresh start!</Text>
				</Box>
			</Box>
		</Box>
	);
}
