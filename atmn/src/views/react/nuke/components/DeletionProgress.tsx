import { Box, Text } from "ink";
import React from "react";
import type { NukePhaseStats } from "../../../../commands/nuke/types.js";

interface DeletionProgressProps {
	phases: NukePhaseStats[];
	activePhase: "customers" | "plans" | "features" | null;
	totalElapsed: number;
}

/**
 * Deletion progress screen with stepper timeline
 * Shows sequential deletion with live progress and sparklines
 */
export function DeletionProgress({
	phases,
	activePhase,
	totalElapsed,
}: DeletionProgressProps) {
	const renderPhase = (phase: NukePhaseStats, index: number) => {
		const isActive = phase.phase === activePhase;
		const isWaiting = !phase.completed && !isActive;

		if (phase.completed) {
			return (
				<Box key={phase.phase} flexDirection="column" marginBottom={1}>
					<Text>
						{index + 1}. {capitalize(phase.phase)}{" "}
						<Text color="green">✓ Complete</Text> ({phase.total}) -{" "}
						{phase.duration?.toFixed(1)}s
					</Text>
				</Box>
			);
		}

		if (isActive) {
			const percentage = phase.total > 0 
				? Math.round((phase.current / phase.total) * 100)
				: 0;
			const filled = Math.floor(percentage / 5);
			const progress = "━".repeat(filled) + "●" + "━".repeat(20 - filled);

			// Simple sparkline based on rate
			const sparkline = generateSparkline(phase.rate);

			return (
				<Box key={phase.phase} flexDirection="column" marginBottom={1}>
					<Text>
						{index + 1}. {capitalize(phase.phase)}{" "}
						<Text color="magenta">{progress}</Text> {phase.current}/{phase.total} (
						{percentage}%)
					</Text>
					{phase.rate > 0 && (
						<Box marginLeft={3}>
							<Text color="magenta">{sparkline}</Text>
						</Box>
					)}
				</Box>
			);
		}

		return (
			<Box key={phase.phase} flexDirection="column" marginBottom={1}>
				<Text dimColor>
					{index + 1}. {capitalize(phase.phase)} ⏳ Waiting... ({phase.total}{" "}
					items)
				</Text>
			</Box>
		);
	};

	return (
		<Box flexDirection="column" padding={1}>
			<Box borderStyle="single" borderColor="magenta" padding={1}>
				<Box flexDirection="column">
					<Text bold color="magenta">Nuke Process</Text>
					<Box height={1} />
					{phases.map((phase, index) => renderPhase(phase, index))}
					<Box height={1} />
					<Text dimColor>Elapsed: {totalElapsed.toFixed(1)}s</Text>
				</Box>
			</Box>
		</Box>
	);
}

function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateSparkline(rate: number): string {
	// Generate a simple sparkline visualization
	// Higher rate = taller bars
	const chars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
	const normalized = Math.min(Math.floor(rate / 2), chars.length - 1);
	const char = chars[normalized] || "▁";
	return char.repeat(10);
}
