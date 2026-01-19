import { Box, Text } from "ink";
import React from "react";
import { AppEnv } from "../../../../lib/env/index.js";

// Frontend URL constant
const FRONTEND_URL = "https://app.useautumn.com";

interface CompletionMessageProps {
	duration: string;
	environment?: AppEnv;
}

/**
 * Completion message with timing and dashboard link
 */
export function CompletionMessage({
	duration,
	environment,
}: CompletionMessageProps) {
	const dashboardPath =
		environment === AppEnv.Live ? "/products" : "/sandbox/products";

	return (
		<Box flexDirection="column" marginTop={1}>
			<Text color="green">✨ Done in {duration}s</Text>
			<Text color="magenta">
				View at: {FRONTEND_URL}
				{dashboardPath}
			</Text>
		</Box>
	);
}
