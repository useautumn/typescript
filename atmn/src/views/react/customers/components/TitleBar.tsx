import { Box, Text } from "ink";
import React from "react";
import type { TitleBarProps } from "../types.js";

// Get version from package.json (injected at build time or fallback)
const VERSION = "1.0.0-beta.2";

/**
 * Title bar showing version, command name, and pagination info
 */
export function TitleBar({ environment, pagination }: TitleBarProps) {
	return (
		<Box
			borderStyle="round"
			borderColor="gray"
			paddingX={1}
			width="100%"
			justifyContent="center"
		>
			<Text color="gray">v{VERSION}</Text>
			<Text color="gray"> │ </Text>
			<Text bold color="white">atmn customers</Text>
			<Text color="gray"> │ </Text>
			<Text color="gray">{pagination.display}</Text>
		</Box>
	);
}
