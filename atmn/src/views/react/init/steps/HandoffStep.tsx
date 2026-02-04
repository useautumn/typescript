import { MultiSelect, Select, TextInput } from "@inkjs/ui";
import { Box, Text, useApp } from "ink";
import open from "open";
import { useState } from "react";
import { useClipboard, useCreateSkills } from "../../../../lib/hooks/index.js";
import { StatusLine, StepHeader } from "../../components/index.js";

// System prompt for AI integration - will be copied to clipboard
const SYSTEM_PROMPT = `You are an expert AI assistant that helps users set up Autumn, a billing and entitlements layer over Stripe. The user has already installed Autumn Skills ready for you to use the load skill tool.

Begin by helping the user create their first customer in Autumn by loading the 'autumn-creating-customer' skill.
Then setup accepting payments by loading the 'autumn-accepting-payments' skill.
Lastly start tracking usage by loading the 'autumn-tracking-usage' skill.`;

interface HandoffStepProps {
	step: number;
	totalSteps: number;
	hasPricing: boolean;
	hasCustomers: boolean;
	onComplete: () => void;
}

type HandoffState =
	| "ai_choice"
	| "location_choice"
	| "custom_path_input"
	| "creating"
	| "next_steps"
	| "complete_with_customers"
	| "manual_exit";

const PRESET_LOCATIONS = [
	{ label: ".claude/skills (Claude Code)", value: ".claude/skills" },
	{ label: ".agents/skills (OpenCode)", value: ".agents/skills" },
	{ label: "Custom path...", value: "custom" },
];

export function HandoffStep({
	step,
	totalSteps,
	hasPricing,
	hasCustomers,
	onComplete,
}: HandoffStepProps) {
	const { exit } = useApp();
	const { copy, showingFeedback } = useClipboard();
	// Start with ai_choice if no customers, otherwise complete
	const [state, setState] = useState<HandoffState>(
		hasCustomers ? "complete_with_customers" : "ai_choice",
	);
	const [customPath, setCustomPath] = useState("");
	const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
	const [allCreatedDirs, setAllCreatedDirs] = useState<string[]>([]);
	const { create, state: skillsState, filesCreated, error } = useCreateSkills();

	const nextStepsOptions = [
		{ label: "Open Autumn docs", value: "docs" },
		{
			label: "Copy our AI system prompt to implement Autumn for you",
			value: "copy",
		},
		{ label: "Thanks, I'll figure it out myself", value: "exit" },
	];

	const aiChoiceOptions = [
		{ label: "Yes", value: "yes" },
		{ label: "No thanks", value: "no" },
	];

	const handleAiChoice = (value: string) => {
		if (value === "no") {
			// Skip to next_steps
			setState("next_steps");
			return;
		}
		// Show location selector
		setState("location_choice");
	};

	const handleLocationSubmit = async (values: string[]) => {
		if (values.length === 0) {
			// Nothing selected, go to next_steps
			setState("next_steps");
			return;
		}

		// Store selections
		setSelectedLocations(values);

		// Check if custom path was selected
		if (values.includes("custom")) {
			setState("custom_path_input");
			return;
		}

		// No custom path needed, create skills directly
		await createSkillsInLocations(values);
	};

	const handleCustomPathSubmit = async (value: string) => {
		const trimmedPath = value.trim();

		// Replace "custom" with actual path (or remove if empty)
		const locations = selectedLocations
			.filter((loc) => loc !== "custom")
			.concat(trimmedPath ? [trimmedPath] : []);

		if (locations.length === 0) {
			// No locations, go to next_steps
			setState("next_steps");
			return;
		}

		await createSkillsInLocations(locations);
	};

	const createSkillsInLocations = async (locations: string[]) => {
		setState("creating");

		// Create skills in all selected locations
		for (const location of locations) {
			await create(location, { saveAll: true, hasPricing });
		}

		setAllCreatedDirs(locations);
		// After creating skills, go to next_steps
		setState("next_steps");
	};

	const handleNextStepsChoice = async (value: string) => {
		if (value === "docs") {
			await open("https://docs.useautumn.com");
		} else if (value === "copy") {
			await copy(SYSTEM_PROMPT);
		}

		// All options exit the app
		setState("manual_exit");
		setTimeout(() => {
			exit();
		}, 100);
	};

	// User already has customers - they're all set!
	if (state === "complete_with_customers") {
		setTimeout(() => {
			exit();
		}, 100);

		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Next Steps" />
				<Box flexDirection="column">
					<StatusLine status="success" message="You're all set!" />
					<Box marginTop={1} flexDirection="column" gap={0}>
						<Text dimColor>
							Docs: <Text color="cyan">https://docs.useautumn.com</Text>
						</Text>
						<Text dimColor>
							Discord: <Text color="cyan">https://discord.gg/atmn</Text>
						</Text>
					</Box>
				</Box>
			</Box>
		);
	}

	// First question: Would you like AI skills?
	if (state === "ai_choice") {
		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Next Steps" />
				<Box flexDirection="column">
					<Text>Would you like us to setup Autumn's AI skills?</Text>
					<Box marginTop={1}>
						<Select options={aiChoiceOptions} onChange={handleAiChoice} />
					</Box>
				</Box>
			</Box>
		);
	}

	// Multi-select for skill locations
	if (state === "location_choice") {
		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Next Steps" />
				<Box flexDirection="column">
					<Text>Where should we save the skills?</Text>
					<Text dimColor>(space to select, enter to confirm)</Text>
					<Box marginTop={1}>
						<MultiSelect
							options={PRESET_LOCATIONS}
							defaultValue={[".claude/skills"]}
							onSubmit={handleLocationSubmit}
						/>
					</Box>
				</Box>
			</Box>
		);
	}

	// Custom path input
	if (state === "custom_path_input") {
		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Next Steps" />
				<Box flexDirection="column">
					<Text>Enter the custom path (relative to project root):</Text>
					<Box marginTop={1}>
						<Text color="gray">{">"} </Text>
						<TextInput
							placeholder="e.g., .cursor/skills"
							value={customPath}
							onChange={setCustomPath}
							onSubmit={handleCustomPathSubmit}
						/>
					</Box>
				</Box>
			</Box>
		);
	}

	// Creating skills
	if (state === "creating") {
		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Next Steps" />
				<StatusLine status="loading" message="Setting up your skills..." />
			</Box>
		);
	}

	// Next steps menu (shown after skills created or skipped)
	if (state === "next_steps") {
		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Next Steps" />
				<Box flexDirection="column">
					{/* Show created skills if any */}
					{allCreatedDirs.length > 0 && (
						<Box marginBottom={1} flexDirection="column">
							<StatusLine status="success" message="Skills created!" />
							<Box marginTop={1} flexDirection="column">
								{allCreatedDirs.map((dir) => (
									<Box key={dir} flexDirection="column">
										<Text color="cyan">{dir}/</Text>
										{filesCreated.map((file, index) => (
											<Text key={`${dir}-${file}`} color="cyan">
												{index === filesCreated.length - 1 ? "└── " : "├── "}
												{file}
											</Text>
										))}
									</Box>
								))}
							</Box>
						</Box>
					)}

					<Text>What would you like to do next?</Text>
					{showingFeedback && (
						<Box marginTop={1}>
							<Text color="green">Copied to clipboard!</Text>
						</Box>
					)}
					<Box marginTop={1}>
						<Select
							options={nextStepsOptions}
							onChange={handleNextStepsChoice}
						/>
					</Box>
				</Box>
			</Box>
		);
	}

	// Manual exit
	if (state === "manual_exit") {
		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Next Steps" />
				<Box flexDirection="column">
					<StatusLine status="success" message="You're all set!" />
					<Box marginTop={1} flexDirection="column" gap={0}>
						<Text dimColor>
							Docs: <Text color="cyan">https://docs.useautumn.com</Text>
						</Text>
						<Text dimColor>
							Discord: <Text color="cyan">https://discord.gg/atmn</Text>
						</Text>
						<Text dimColor>
							Run <Text color="magenta">atmn push</Text> when you're ready to
							sync your config
						</Text>
					</Box>
				</Box>
			</Box>
		);
	}

	return null;
}
