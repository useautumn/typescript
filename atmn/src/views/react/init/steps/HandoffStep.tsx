import fs from "node:fs/promises";
import path from "node:path";
import { Select } from "@inkjs/ui";
import { Box, Text, useApp } from "ink";
import React, { useState } from "react";
import { customerPrompt } from "../../../../prompts/customer.js";
import { paymentsPrompt } from "../../../../prompts/payments.js";
import { pricingPrompt } from "../../../../prompts/pricing.js";
import { usagePrompt } from "../../../../prompts/usage.js";
import { StatusLine, StepHeader } from "../../components/index.js";

interface HandoffStepProps {
	step: number;
	totalSteps: number;
	hasPricing: boolean;
	onComplete: () => void;
}

type HandoffState = "ai_choice" | "creating" | "complete" | "manual_exit";

const GUIDES_DIR = "autumn-guides";

export function HandoffStep({
	step,
	totalSteps,
	hasPricing,
	onComplete,
}: HandoffStepProps) {
	const { exit } = useApp();
	const [state, setState] = useState<HandoffState>("ai_choice");
	const [error, setError] = useState<string | null>(null);
	const [filesCreated, setFilesCreated] = useState<string[]>([]);

	const aiChoiceOptions = [
		{ label: "Yes, set me up with AI guides", value: "yes" },
		{ label: "No thanks, I'll figure it out", value: "no" },
	];

	const handleAiChoice = async (value: string) => {
		if (value === "no") {
			setState("manual_exit");
			setTimeout(() => {
				exit();
			}, 100);
			return;
		}

		// AI-assisted path
		setState("creating");

		try {
			const cwd = process.cwd();
			const guidesPath = path.join(cwd, GUIDES_DIR);

			// Create the guides directory
			await fs.mkdir(guidesPath, { recursive: true });

			const created: string[] = [];

			// Always write customer, payments, usage guides
			await fs.writeFile(
				path.join(guidesPath, "1_Customer_Creation.md"),
				customerPrompt,
				"utf-8",
			);
			created.push("1_Customer_Creation.md");

			await fs.writeFile(
				path.join(guidesPath, "2_Accepting_Payments.md"),
				paymentsPrompt,
				"utf-8",
			);
			created.push("2_Accepting_Payments.md");

			await fs.writeFile(
				path.join(guidesPath, "3_Tracking_Usage.md"),
				usagePrompt,
				"utf-8",
			);
			created.push("3_Tracking_Usage.md");

			// Only write pricing guide if user doesn't have pricing yet
			if (!hasPricing) {
				await fs.writeFile(
					path.join(guidesPath, "0_Designing_Pricing.md"),
					pricingPrompt,
					"utf-8",
				);
				created.unshift("0_Designing_Pricing.md");
			}

			setFilesCreated(created);
			setState("complete");

			setTimeout(() => {
				exit();
			}, 100);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create guides");
			setState("complete");
		}
	};

	if (state === "ai_choice") {
		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Next Steps" />
				<Box flexDirection="column">
					<Text>Want us to generate guides for your AI coding assistant?</Text>
					<Box marginTop={1}>
						<Select options={aiChoiceOptions} onChange={handleAiChoice} />
					</Box>
				</Box>
			</Box>
		);
	}

	if (state === "creating") {
		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Next Steps" />
				<StatusLine status="loading" message="Setting up your guides..." />
			</Box>
		);
	}

	if (state === "manual_exit") {
		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Next Steps" />
				<Box flexDirection="column">
					<StatusLine status="success" message="You're all set!" />
					<Box marginTop={1} flexDirection="column" gap={0}>
						<Text>
							📚 Documentation:{" "}
							<Text color="cyan">https://docs.useautumn.com</Text>
						</Text>
						<Text>
							💬 Discord:{" "}
							<Text color="cyan">https://discord.gg/atmn</Text>
						</Text>
						<Text dimColor>
							Run <Text color="magenta">atmn push</Text> when you're ready to sync your config
						</Text>
					</Box>
				</Box>
			</Box>
		);
	}

	if (state === "complete") {
		if (error) {
			return (
				<Box flexDirection="column" marginBottom={1}>
					<StepHeader step={step} totalSteps={totalSteps} title="Next Steps" />
					<StatusLine status="error" message={error} />
				</Box>
			);
		}

		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Next Steps" />
				<Box flexDirection="column">
					<StatusLine status="success" message="You're all set!" />
					
					{/* File tree */}
					<Box marginTop={1} flexDirection="column">
						<Text color="cyan">{GUIDES_DIR}/</Text>
						{filesCreated.map((file, index) => (
							<Text key={file} color="cyan">
								{index === filesCreated.length - 1 ? "└── " : "├── "}{file}
							</Text>
						))}
					</Box>

					{/* Instructions */}
					<Box marginTop={1} flexDirection="column" gap={0}>
						<Text>
							Open these in order with your AI agent (Claude, Cursor, etc.)
						</Text>
						<Text>
							Each guide walks through one part of the integration.
						</Text>
					</Box>

					{/* Help links */}
					<Box marginTop={1} flexDirection="column" gap={0}>
						<Text dimColor>
							📚 Documentation: <Text color="cyan">https://docs.useautumn.com</Text>
						</Text>
						<Text dimColor>
							💬 Discord: <Text color="cyan">https://discord.gg/atmn</Text>
						</Text>
					</Box>
				</Box>
			</Box>
		);
	}

	return null;
}
