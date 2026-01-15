import { Box, Text } from "ink";
import React, { useEffect } from "react";

interface SuccessScreenProps {
	customers: number;
	plans: number;
	features: number;
	backupPath?: string;
	onComplete: () => void;
}

/**
 * Success screen showing summary before explosion animation
 */
export function SuccessScreen({
	customers,
	plans,
	features,
	backupPath,
	onComplete,
}: SuccessScreenProps) {
	// Auto-advance to explosion after 1.5 seconds
	useEffect(() => {
		const timer = setTimeout(() => {
			onComplete();
		}, 1500);

		return () => clearTimeout(timer);
	}, [onComplete]);

	return (
		<Box flexDirection="column" padding={1}>
			<Box borderStyle="single" borderColor="magenta" padding={1}>
				<Box flexDirection="column">
					<Text bold color="magenta">Nuke Complete</Text>
					<Box height={1} />
					<Text color="green">✓ {customers} customers deleted</Text>
					<Text color="green">✓ {plans} plans deleted</Text>
					<Text color="green">✓ {features} features deleted</Text>
					<Box height={1} />
					{backupPath && (
						<>
							<Text dimColor>Backup: {backupPath}</Text>
							<Box height={1} />
						</>
					)}
					<Text bold>Your sandbox is now empty.</Text>
				</Box>
			</Box>
		</Box>
	);
}
