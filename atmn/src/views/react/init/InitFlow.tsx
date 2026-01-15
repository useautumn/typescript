import { Box, Text } from "ink";
import React, { useState } from "react";

import { AuthStep } from "./steps/AuthStep.js";
import { ConfigStep } from "./steps/ConfigStep.js";
import { HandoffStep } from "./steps/HandoffStep.js";

const TOTAL_STEPS = 3;

type Step = "auth" | "config" | "handoff";

interface OrgInfo {
	name: string;
	slug: string;
}

export function InitFlow() {
	const [currentStep, setCurrentStep] = useState<Step>("auth");
	const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
	const [hasPricing, setHasPricing] = useState<boolean>(false);

	const handleAuthComplete = (info: OrgInfo) => {
		setOrgInfo(info);
		setCurrentStep("config");
	};

	const handleConfigComplete = (configHasPricing: boolean) => {
		setHasPricing(configHasPricing);
		setCurrentStep("handoff");
	};

	const handleHandoffComplete = () => {
		// HandoffStep handles exit via useApp()
	};

	return (
		<Box flexDirection="column" paddingLeft={1} paddingRight={1}>
			{/* Welcome message */}
			<Box marginBottom={1}>
				<Text>
					Welcome to{" "}
					<Text color="magenta" bold>
						Autumn
					</Text>
					! Let's set up your billing.
				</Text>
			</Box>

			{/* Step 1: Authentication */}
			<AuthStep
				step={1}
				totalSteps={TOTAL_STEPS}
				onComplete={handleAuthComplete}
			/>

			{/* Step 2: Configuration (only show after auth) */}
			{(currentStep === "config" || currentStep === "handoff") && (
				<ConfigStep
					step={2}
					totalSteps={TOTAL_STEPS}
					onComplete={handleConfigComplete}
				/>
			)}

			{/* Step 3: Handoff */}
			{currentStep === "handoff" && (
				<HandoffStep
					step={3}
					totalSteps={TOTAL_STEPS}
					hasPricing={hasPricing}
					onComplete={handleHandoffComplete}
				/>
			)}
		</Box>
	);
}
