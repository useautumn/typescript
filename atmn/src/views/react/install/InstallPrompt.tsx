import { execSync } from "child_process";
import { Box, Text, useApp } from "ink";
import { useCallback, useState } from "react";
import {
	SelectMenu,
	type SelectMenuItem,
	StatusLine,
} from "../components/index.js";

type PackageManager = "npm" | "pnpm" | "bun";
type InstallState = "choosing" | "installing" | "success" | "skipped";

export function InstallPrompt() {
	const { exit } = useApp();
	const [state, setState] = useState<InstallState>("choosing");
	const [error, setError] = useState<string | null>(null);

	const items: SelectMenuItem<PackageManager>[] = [
		{ label: "npm", value: "npm" },
		{ label: "pnpm", value: "pnpm" },
		{ label: "bun", value: "bun" },
	];

	const handleSelect = useCallback(
		(item: SelectMenuItem<PackageManager>) => {
			setState("installing");

			const commands: Record<PackageManager, string> = {
				npm: "npm install atmn",
				pnpm: "pnpm add atmn",
				bun: "bun add atmn",
			};

			try {
				execSync(commands[item.value], { stdio: "inherit" });
				setState("success");
				setTimeout(() => exit(), 500);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Installation failed",
				);
			}
		},
		[exit],
	);

	if (error) {
		return (
			<Box flexDirection="column" paddingLeft={1}>
				<StatusLine status="error" message={`Failed to install atmn: ${error}`} />
				<Text dimColor>
					Install manually: npm install atmn / pnpm add atmn / bun add atmn
				</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" paddingLeft={1}>
			<Box marginBottom={1}>
				<Text>
					<Text color="yellow">!</Text> The{" "}
					<Text color="magenta" bold>
						atmn
					</Text>{" "}
					package is not in your dependencies.
				</Text>
			</Box>
			<Text dimColor>
				It's needed so autumn.config.ts can import types and builders.
			</Text>

			{state === "choosing" && (
				<Box flexDirection="column" marginTop={1}>
					<Text>Install with:</Text>
					<Box marginTop={1}>
						<SelectMenu items={items} onSelect={handleSelect} />
					</Box>
				</Box>
			)}

			{state === "installing" && (
				<Box marginTop={1}>
					<StatusLine status="loading" message="Installing atmn..." />
				</Box>
			)}

			{state === "success" && (
				<Box marginTop={1}>
					<StatusLine status="success" message="atmn installed" />
				</Box>
			)}
		</Box>
	);
}
