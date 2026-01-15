import { Box, Text } from "ink";
import React, { useEffect, useState } from "react";
import Spinner from "ink-spinner";
import { validateSandboxOnly, validateCustomerLimit, getMaxCustomers, NukeValidationError } from "../../../commands/nuke/validation.js";
import { createConfigBackup } from "../../../commands/nuke/backup.js";
import { getKey } from "../../../lib/env/index.js";
import { AppEnv } from "../../../lib/env/detect.js";
import { useNukeData } from "../../../lib/hooks/useNukeData.js";
import { useNuke } from "../../../lib/hooks/useNuke.js";
import { NukeAnimation } from "./NukeAnimation.js";
import { BackupPrompt } from "./components/BackupPrompt.js";
import { ConfirmScreen } from "./components/ConfirmScreen.js";
import { DeletionProgress } from "./components/DeletionProgress.js";
import { WarningScreen } from "./components/WarningScreen.js";

type NukeState = 
	| "validating"
	| "loading"
	| "error"
	| "warning"
	| "backup"
	| "confirm"
	| "deleting"
	| "explosion"
	| "complete";

interface InlineNukeFlowProps {
	onComplete: () => void;
	onCancel: () => void;
}

/**
 * Inline nuke flow for use within InitFlow ConfigStep
 * Simplified flow without fullscreen takeover
 */
export function InlineNukeFlow({ onComplete, onCancel }: InlineNukeFlowProps) {
	const [state, setState] = useState<NukeState>("validating");
	const [backupCreated, setBackupCreated] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Fetch org and counts
	const { data: nukeData, isLoading, error: fetchError } = useNukeData();

	// Nuke mutation
	const {
		nuke,
		phases,
		activePhase,
		totalElapsed,
		isNuking,
		error: nukeError,
	} = useNuke({
		onComplete: () => {
			setState("explosion");
		},
		onError: (err) => {
			setError(err.message);
			setState("error");
		},
	});

	// Validation on mount
	useEffect(() => {
		try {
			const secretKey = getKey(AppEnv.Sandbox);
			validateSandboxOnly(secretKey);
			setState("loading");
		} catch (err) {
			if (err instanceof NukeValidationError) {
				setError(err.message);
				setState("error");
			} else {
				setError("Failed to validate environment");
				setState("error");
			}
		}
	}, []);

	// After data loads, validate customer limit
	useEffect(() => {
		if (state === "loading" && nukeData) {
			try {
				const maxCustomers = getMaxCustomers();
				validateCustomerLimit(nukeData.customersCount, maxCustomers);
				setState("warning");
			} catch (err) {
				if (err instanceof NukeValidationError) {
					setError(err.message);
					setState("error");
				}
			}
		}
	}, [state, nukeData]);

	const handleWarningConfirm = () => {
		setState("backup");
	};

	const handleWarningCancel = () => {
		onCancel();
	};

	const handleBackupChoice = (createBackup: boolean) => {
		if (createBackup) {
			const result = createConfigBackup();
			setBackupCreated(result.created);
		}
		setState("confirm");
	};

	const handleFinalConfirm = () => {
		setState("deleting");
		nuke();
	};

	const handleFinalCancel = () => {
		onCancel();
	};

	const handleExplosionComplete = () => {
		setState("complete");
		// Short delay before calling onComplete
		setTimeout(() => {
			onComplete();
		}, 500);
	};

	// Render current state
	if (state === "validating") {
		return (
			<Box flexDirection="column">
				<Text>
					<Text color="magenta">
						<Spinner type="dots" />
					</Text>{" "}
					Validating environment...
				</Text>
			</Box>
		);
	}

	if (state === "loading") {
		if (isLoading) {
			return (
				<Box flexDirection="column">
					<Text>
						<Text color="magenta">
							<Spinner type="dots" />
						</Text>{" "}
						Loading organization data...
					</Text>
				</Box>
			);
		}

		if (fetchError) {
			return (
				<Box flexDirection="column">
					<Text color="red">✗ Failed to load data</Text>
					<Text dimColor>{fetchError.message}</Text>
				</Box>
			);
		}
	}

	if (state === "error") {
		return (
			<Box flexDirection="column">
				<Text color="red">{error}</Text>
				<Box marginTop={1}>
					<Text dimColor>Press Esc to go back</Text>
				</Box>
			</Box>
		);
	}

	if (!nukeData) {
		return null;
	}

	switch (state) {
		case "warning":
			return (
				<WarningScreen
					orgName={nukeData.orgName}
					customers={nukeData.customersCount}
					plans={nukeData.plansCount}
					features={nukeData.featuresCount}
					onConfirm={handleWarningConfirm}
					onCancel={handleWarningCancel}
				/>
			);

		case "backup":
			return <BackupPrompt onChoice={handleBackupChoice} />;

		case "confirm":
			return (
				<ConfirmScreen
					orgName={nukeData.orgName}
					customers={nukeData.customersCount}
					plans={nukeData.plansCount}
					features={nukeData.featuresCount}
					onConfirm={handleFinalConfirm}
					onCancel={handleFinalCancel}
				/>
			);

		case "deleting":
			return (
				<DeletionProgress
					phases={phases}
					activePhase={activePhase}
					totalElapsed={totalElapsed}
				/>
			);

		case "explosion":
			return (
				<Box flexDirection="column">
					<NukeAnimation 
						onComplete={handleExplosionComplete}
						contained={true}
						containedHeight={10}
						maxFrames={20}
					/>
				</Box>
			);

		case "complete":
			return null;

		default:
			return null;
	}
}
