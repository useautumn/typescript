import React from "react";
import { Text } from "ink";
import type { Plan } from "../../../../../source/compose/models/index.js";

interface PlanRowProps {
	plan: Plan;
}

/**
 * Displays a single plan with checkmark and feature count
 */
export function PlanRow({ plan }: PlanRowProps) {
	const featureCount = plan.features?.length || 0;

	return (
		<Text>
			<Text color="green">✓</Text> {plan.name}{" "}
			<Text color="gray">
				{featureCount} {featureCount === 1 ? "feature" : "features"}
			</Text>
		</Text>
	);
}
