import { MultiSelect } from "@inkjs/ui";
import clipboard from "clipboardy";
import { Box, Text } from "ink";
import React, { useState } from "react";
import { StatusLine, StepHeader } from "../../components/index.js";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const execAsync = promisify(exec);

interface AgentStepProps {
	step: number;
	totalSteps: number;
	onComplete: () => void;
}

type AgentState =
	| "selecting"
	| "mcp-agents"
	| "installing"
	| "creating"
	| "complete"
	| "error";

/**
 * Agent setup step - allows user to configure agent files
 */
export function AgentStep({ step, totalSteps, onComplete }: AgentStepProps) {
	const [state, setState] = useState<AgentState>("selecting");
	const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
	const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);

	const options = [
		{
			label: "MCP Server Config (for Claude Code, OpenCode, etc.)",
			value: "mcp",
		},
		{
			label: "CLAUDE.md",
			value: "claude-md",
		},
		{
			label: "AGENTS.md",
			value: "agents-md",
		},
		{
			label: ".cursorrules",
			value: "cursor-rules",
		},
	];

	const agentOptions = [
		{
			label: "Claude Code (auto-install via command)",
			value: "claude-code",
		},
		{
			label: "OpenCode, Codex and others (copy URL to clipboard)",
			value: "other",
		},
	];

	const handleSubmit = (values: string[]) => {
		setSelectedOptions(values);

		// If MCP is selected, go to agent selection
		if (values.includes("mcp")) {
			setState("mcp-agents");
		} else {
			// Otherwise, create the other files
			setState("creating");
			createFiles(values);
		}
	};

	const handleAgentSubmit = (agents: string[]) => {
		setSelectedAgents(agents);
		setState("installing");

		// Install MCP for selected agents
		installMCP(agents);
	};

	const installMCP = async (agents: string[]) => {
		try {
			const mcpUrl = "https://docs.useautumn.com/mcp";

			// Handle each selected agent
			for (const agent of agents) {
				if (agent === "claude-code") {
					// Execute command to install MCP for Claude Code
					try {
						await execAsync(`claude mcp add --transport http autumn ${mcpUrl}`);
					} catch (err) {
						// If it fails, it might already exist - check the error message
						const errorMessage = err instanceof Error ? err.message : String(err);
						if (!errorMessage.includes("already exists")) {
							// If it's not an "already exists" error, throw it
							throw err;
						}
						// Otherwise, silently continue (already installed is fine)
					}
				} else if (agent === "other") {
					// Copy URL to clipboard
					await clipboard.write(mcpUrl);
				}
			}

			// Now create the other selected files
			const nonMcpOptions = selectedOptions.filter((opt) => opt !== "mcp");
			if (nonMcpOptions.length > 0) {
				setState("creating");
				await createFiles(nonMcpOptions);
			} else {
				setState("complete");
				setTimeout(() => {
					onComplete();
				}, 1000);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to install MCP");
			setState("error");
		}
	};

	const createFiles = async (options: string[]) => {
		try {
			const cwd = process.cwd();

			// Lorem ipsum content for markdown files
			const markdownContent = `

# Autumn Billing Integration

## Overview

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Usage

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Features

- Lorem ipsum dolor sit amet
- Consectetur adipiscing elit
- Sed do eiusmod tempor incididunt

## Resources

- [Autumn Documentation](https://docs.useautumn.com)
- [API Reference](https://docs.useautumn.com/api)
`;

			// Lorem ipsum content for .cursorrules
			const cursorRulesContent = `

# Autumn Billing Rules

Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
`;

			// Helper function to append or create file
			const appendOrCreate = async (filePath: string, content: string) => {
				try {
					// Try to read existing file
					await fs.access(filePath);
					// File exists, append content
					await fs.appendFile(filePath, content, "utf-8");
				} catch {
					// File doesn't exist, create it
					await fs.writeFile(filePath, content.trimStart(), "utf-8");
				}
			};

			// Create/append files based on selected options
			for (const option of options) {
				if (option === "claude-md") {
					await appendOrCreate(path.join(cwd, "CLAUDE.md"), markdownContent);
				} else if (option === "agents-md") {
					await appendOrCreate(path.join(cwd, "AGENTS.md"), markdownContent);
				} else if (option === "cursor-rules") {
					await appendOrCreate(path.join(cwd, ".cursorrules"), cursorRulesContent);
				}
			}

			setState("complete");
			setTimeout(() => {
				onComplete();
			}, 1000);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create files");
			setState("error");
		}
	};

	const handleChange = (values: string[]) => {
		setSelectedOptions(values);
	};

	const handleAgentChange = (values: string[]) => {
		setSelectedAgents(values);
	};

	if (state === "selecting") {
		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Agent Setup" />
				<Box flexDirection="column">
					<Text>Select agent configuration files to create/update:</Text>
					<Text dimColor>(Space to select, Enter to confirm)</Text>
					<Box marginTop={1}>
						<MultiSelect
							options={options}
							onChange={handleChange}
							onSubmit={handleSubmit}
							visibleOptionCount={5}
						/>
					</Box>
				</Box>
			</Box>
		);
	}

	if (state === "mcp-agents") {
		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Agent Setup" />
				<Box flexDirection="column">
					<Text>Which agent(s) are you using?</Text>
					<Text dimColor>(Space to select, Enter to confirm)</Text>
					<Box marginTop={1}>
						<MultiSelect
							options={agentOptions}
							onChange={handleAgentChange}
							onSubmit={handleAgentSubmit}
							visibleOptionCount={5}
						/>
					</Box>
				</Box>
			</Box>
		);
	}

	if (state === "installing") {
		const installMessages: string[] = [];

		if (selectedAgents.includes("claude-code")) {
			installMessages.push("Installing MCP for Claude Code...");
		}

		if (
			selectedAgents.includes("opencode") ||
			selectedAgents.includes("other")
		) {
			installMessages.push("Copied MCP URL to clipboard!");
		}

		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Agent Setup" />
				<Box flexDirection="column">
					{installMessages.map((msg) => (
						<StatusLine
							key={msg}
							status={msg.includes("Copied") ? "success" : "loading"}
							message={msg}
						/>
					))}
				</Box>
			</Box>
		);
	}

	if (state === "creating") {
		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Agent Setup" />
				<StatusLine
					status="loading"
					message={`Creating ${selectedOptions.filter((o) => o !== "mcp").length} file${selectedOptions.filter((o) => o !== "mcp").length !== 1 ? "s" : ""}...`}
				/>
			</Box>
		);
	}

	if (state === "complete") {
		const createdFiles: string[] = [];

		if (selectedAgents.length > 0) {
			createdFiles.push("MCP server config");
		}
		if (selectedOptions.includes("claude-md")) {
			createdFiles.push("CLAUDE.md");
		}
		if (selectedOptions.includes("agents-md")) {
			createdFiles.push("AGENTS.md");
		}
		if (selectedOptions.includes("cursor-rules")) {
			createdFiles.push(".cursorrules");
		}

		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Agent Setup" />
				<StatusLine
					status="success"
					message={
						createdFiles.length > 0
							? `Created ${createdFiles.join(", ")}`
							: "Setup complete"
					}
				/>
			</Box>
		);
	}

	if (state === "error") {
		return (
			<Box flexDirection="column" marginBottom={1}>
				<StepHeader step={step} totalSteps={totalSteps} title="Agent Setup" />
				<StatusLine
					status="error"
					message={error || "Failed to create files"}
				/>
			</Box>
		);
	}

	return null;
}
