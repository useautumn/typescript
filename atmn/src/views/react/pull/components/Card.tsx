import type { ReactNode } from "react";
import React from "react";
import { Box, Text } from "ink";

interface CardProps {
	title: string;
	children?: ReactNode;
}

/**
 * Reusable card component with rounded border
 */
export function Card({ title, children }: CardProps) {
	return (
		<Box
			borderStyle="round"
			borderColor="magenta"
			paddingX={1}
			paddingY={0}
			flexDirection="column"
		>
			<Text bold color="magenta">
				{title}
			</Text>
			{children && (
				<Box flexDirection="column" marginTop={1}>
					{children}
				</Box>
			)}
		</Box>
	);
}
