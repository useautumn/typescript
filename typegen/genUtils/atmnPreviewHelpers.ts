/**
 * Generate preview display utilities for atmn CLI
 *
 * Copies and adapts display functions from @autumn/shared to work with atmn types.
 * This keeps the display logic in sync with the main codebase.
 *
 * When the server's display utilities are updated, simply re-run `pnpm gen:atmn`
 * to regenerate these files with the latest logic.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";

const AUTO_GEN_HEADER = `// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Generated from @autumn/shared display utilities
// Run \`pnpm gen:atmn\` to regenerate
`;

/**
 * Extract a named export function from TypeScript source code
 * Handles arrow functions with typed parameters like:
 *   export const fn = ({ param }: { type: string }) => { ... }
 */
function extractFunction({
	source,
	functionName,
}: {
	source: string;
	functionName: string;
}): string | null {
	// Match export const functionName = ...
	const arrowFnPattern = new RegExp(
		`export\\s+const\\s+${functionName}\\s*=\\s*`,
		"g",
	);
	const match = arrowFnPattern.exec(source);

	if (!match) {
		return null;
	}

	const startIndex = match.index;
	let braceCount = 0;
	let parenCount = 0;
	let inString = false;
	let stringChar = "";
	let foundArrow = false;
	let foundFunctionBody = false;
	let endIndex = startIndex;

	// Find the end of the function by:
	// 1. First, find the arrow (=>)
	// 2. Then count braces for the function body
	for (let i = match.index + match[0].length; i < source.length; i++) {
		const char = source[i];
		const prevChar = source[i - 1];
		const nextChar = source[i + 1];

		// Handle string detection
		if ((char === '"' || char === "'" || char === "`") && prevChar !== "\\") {
			if (!inString) {
				inString = true;
				stringChar = char;
			} else if (char === stringChar) {
				inString = false;
			}
		}

		if (!inString) {
			// Track parentheses to skip over type annotations in params
			if (char === "(") parenCount++;
			if (char === ")") parenCount--;

			// Look for the arrow =>
			if (!foundArrow && char === "=" && nextChar === ">") {
				foundArrow = true;
				continue;
			}

			// Once we've found the arrow, look for the function body
			if (foundArrow) {
				if (char === "{") {
					braceCount++;
					foundFunctionBody = true;
				}
				if (char === "}") {
					braceCount--;
					if (foundFunctionBody && braceCount === 0) {
						endIndex = i + 1;
						// Skip to semicolon if present
						if (source[i + 1] === ";") {
							endIndex = i + 2;
						}
						break;
					}
				}
			}
		}
	}

	return source.substring(startIndex, endIndex);
}

/**
 * Transform server code to be standalone (remove imports, replace enums with literals)
 */
function transformToStandalone({ code }: { code: string }): string {
	let result = code;

	// Replace enum references with string literals
	result = result.replace(/BillingInterval\.OneOff/g, '"one_off"');
	result = result.replace(/EntInterval\.Lifetime/g, '"lifetime"');
	result = result.replace(/BillingInterval\.SemiAnnual/g, '"semi_annual"');
	result = result.replace(/EntInterval\.SemiAnnual/g, '"semi_annual"');
	result = result.replace(/ProductItemInterval\.SemiAnnual/g, '"semi_annual"');

	// Remove explicit interval type annotation, use string
	result = result.replace(/interval\?\s*:\s*IntervalType/g, "interval?: string");
	result = result.replace(
		/interval\?\s*:\s*BillingInterval\s*\|\s*EntInterval\s*\|\s*ProductItemInterval/g,
		"interval?: string",
	);

	// Clean up redundant conditions that result from enum replacement
	// e.g., (a === "x" || a === "x" || a === "x") -> (a === "x")
	result = result.replace(
		/\(\s*interval\s*===\s*"semi_annual"\s*\|\|\s*interval\s*===\s*"semi_annual"\s*\|\|\s*interval\s*===\s*"semi_annual"\s*\)/g,
		'(interval === "semi_annual")',
	);

	return result;
}

/**
 * Generate the displayUtils.ts file for atmn preview command
 */
export function generatePreviewDisplayUtils({
	serverPath,
	atmnPath,
}: {
	serverPath: string;
	atmnPath: string;
}): void {
	const outputDir = path.join(atmnPath, "src/commands/preview");
	mkdirSync(outputDir, { recursive: true });

	// Read source files from @autumn/shared
	const formatAmountSrc = readFileSync(
		path.join(serverPath, "utils/common/formatUtils/formatAmount.ts"),
		"utf-8",
	);
	const formatIntervalSrc = readFileSync(
		path.join(serverPath, "utils/common/formatUtils/formatInterval.ts"),
		"utf-8",
	);
	const displayUtilsSrc = readFileSync(
		path.join(serverPath, "utils/displayUtils.ts"),
		"utf-8",
	);

	// Generate displayUtils.ts by extracting and transforming functions
	const displayUtilsContent = generateDisplayUtilsFile({
		formatAmountSrc,
		formatIntervalSrc,
		displayUtilsSrc,
	});
	writeFileSync(
		path.join(outputDir, "displayUtils.ts"),
		displayUtilsContent,
		"utf-8",
	);

	// Generate planFeatureToItem.ts (translation layer)
	const planFeatureToItemContent = generatePlanFeatureToItemFile();
	writeFileSync(
		path.join(outputDir, "planFeatureToItem.ts"),
		planFeatureToItemContent,
		"utf-8",
	);
}

/**
 * Generate displayUtils.ts content by extracting and adapting functions from shared
 */
function generateDisplayUtilsFile({
	formatAmountSrc,
	formatIntervalSrc,
	displayUtilsSrc,
}: {
	formatAmountSrc: string;
	formatIntervalSrc: string;
	displayUtilsSrc: string;
}): string {
	// Extract functions from server source
	const formatIntervalFn = extractFunction({
		source: formatIntervalSrc,
		functionName: "formatInterval",
	});
	const getFeatureNameFn = extractFunction({
		source: displayUtilsSrc,
		functionName: "getFeatureName",
	});
	const getFeatureNameWithCapitalFn = extractFunction({
		source: displayUtilsSrc,
		functionName: "getFeatureNameWithCapital",
	});
	const getSingularAndPluralFn = extractFunction({
		source: displayUtilsSrc,
		functionName: "getSingularAndPlural",
	});
	const numberWithCommasFn = extractFunction({
		source: displayUtilsSrc,
		functionName: "numberWithCommas",
	});
	const usageToFeatureNameFn = extractFunction({
		source: displayUtilsSrc,
		functionName: "usageToFeatureName",
	});
	const getFeatureInvoiceDescriptionFn = extractFunction({
		source: displayUtilsSrc,
		functionName: "getFeatureInvoiceDescription",
	});

	// Build output
	const sections: string[] = [AUTO_GEN_HEADER];

	// Add minimal Feature type for standalone use
	sections.push(`
/**
 * Minimal Feature type for display functions
 * Matches the shape expected by @autumn/shared display utils
 */
export interface FeatureForDisplay {
	name: string;
	display?: {
		singular?: string;
		plural?: string;
	} | null;
}
`);

	// Add formatAmount (simplified for CLI - no org dependency)
	sections.push(`
/**
 * Format currency amount
 * Adapted from @autumn/shared/utils/common/formatUtils/formatAmount.ts
 */
export const formatAmount = ({
	amount,
	currency = "USD",
	maxFractionDigits = 10,
	minFractionDigits = 0,
}: {
	amount: number;
	currency?: string;
	maxFractionDigits?: number;
	minFractionDigits?: number;
}): string => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
		minimumFractionDigits: minFractionDigits,
		maximumFractionDigits: maxFractionDigits,
	}).format(amount);
};
`);

	// Add formatInterval (transformed)
	if (formatIntervalFn) {
		const transformed = transformToStandalone({ code: formatIntervalFn });
		sections.push(`
/**
 * Format billing interval
 * Copied from @autumn/shared/utils/common/formatUtils/formatInterval.ts
 */
${transformed}
`);
	}

	// Add getFeatureName (transformed)
	if (getFeatureNameFn) {
		// Replace Feature type with our minimal FeatureForDisplay
		let transformed = getFeatureNameFn.replace(
			/feature\?\s*:\s*Feature/g,
			"feature?: FeatureForDisplay",
		);
		transformed = transformed.replace(
			/feature:\s*Feature/g,
			"feature: FeatureForDisplay",
		);
		sections.push(`
/**
 * Get feature name with singular/plural handling
 * Copied from @autumn/shared/utils/displayUtils.ts
 */
${transformed}
`);
	}

	// Add getFeatureNameWithCapital (transformed)
	if (getFeatureNameWithCapitalFn) {
		let transformed = getFeatureNameWithCapitalFn.replace(
			/feature:\s*Feature/g,
			"feature: FeatureForDisplay",
		);
		sections.push(`
/**
 * Get feature name with first letter capitalized
 * Copied from @autumn/shared/utils/displayUtils.ts
 */
${transformed}
`);
	}

	// Add getSingularAndPlural (transformed)
	if (getSingularAndPluralFn) {
		let transformed = getSingularAndPluralFn.replace(
			/feature:\s*Feature/g,
			"feature: FeatureForDisplay",
		);
		sections.push(`
/**
 * Get both singular and plural forms of feature name
 * Copied from @autumn/shared/utils/displayUtils.ts
 */
${transformed}
`);
	}

	// Add numberWithCommas
	if (numberWithCommasFn) {
		sections.push(`
/**
 * Format a number with commas
 * Copied from @autumn/shared/utils/displayUtils.ts
 */
${numberWithCommasFn}
`);
	}

	// Add usageToFeatureName (transformed)
	if (usageToFeatureNameFn) {
		let transformed = usageToFeatureNameFn.replace(
			/feature:\s*Feature/g,
			"feature: FeatureForDisplay",
		);
		sections.push(`
/**
 * Get feature name based on usage count (singular/plural)
 * Copied from @autumn/shared/utils/displayUtils.ts
 */
${transformed}
`);
	}

	// Add getFeatureInvoiceDescription (simplified - no date-fns dependency)
	if (getFeatureInvoiceDescriptionFn) {
		// Create a simplified version without date-fns
		sections.push(`
/**
 * Get invoice description for a feature
 * Adapted from @autumn/shared/utils/displayUtils.ts
 * Note: Simplified to remove date-fns dependency
 */
export const getFeatureInvoiceDescription = ({
	feature,
	usage,
	billingUnits = 1,
	prodName,
	isPrepaid = false,
}: {
	feature: FeatureForDisplay;
	usage: number;
	billingUnits?: number | null;
	prodName?: string;
	isPrepaid?: boolean;
}) => {
	const { singular, plural } = getSingularAndPlural({ feature });

	const usageStr = numberWithCommas(Math.ceil(usage));

	let result = "";

	if (isPrepaid && billingUnits && billingUnits > 1) {
		result = \`\${usageStr} x \${billingUnits} \${plural}\`; // eg. 4 x 100 credits
	} else {
		if (usage === 1) {
			result = \`\${usageStr} \${singular}\`; // eg. 1 credit
		} else {
			result = \`\${usageStr} \${plural}\`; // eg. 4 credits
		}
	}

	if (prodName) {
		result = \`\${prodName} - \${result}\`;
	}

	return result;
};
`);
	}

	// Add formatTiers (always include this for tier display)
	sections.push(`
/**
 * Format tiered pricing range
 */
export const formatTiers = ({
	tiers,
	currency = "USD",
}: {
	tiers: Array<{ to: number | "inf"; amount: number }>;
	currency?: string;
}): string => {
	if (tiers.length === 0) return "";

	if (tiers.length === 1) {
		return formatAmount({ amount: tiers[0].amount, currency });
	}

	const firstAmount = formatAmount({ amount: tiers[0].amount, currency });
	const lastAmount = formatAmount({ amount: tiers[tiers.length - 1].amount, currency });

	return \`\${firstAmount} - \${lastAmount}\`;
};
`);

	return sections.join("\n");
}

/**
 * Generate planFeatureToItem.ts - translation layer from atmn types to ProductItem-like shape
 */
function generatePlanFeatureToItemFile(): string {
	return `${AUTO_GEN_HEADER}

/**
 * Minimal translation from atmn PlanFeature to ProductItem-like shape
 * This allows us to reuse display logic patterns from @autumn/shared
 *
 * NOTE: This is a simplified version for CLI preview. The full conversion
 * lives in @autumn/shared/utils/planFeatureUtils/planFeaturesToItems.ts
 */

import type { Feature, PlanFeature } from "../../compose/index.js";

/**
 * Minimal ProductItem shape needed for display functions
 * Mirrors the fields used by getProductItemDisplay in @autumn/shared
 */
export interface ProductItemLike {
	feature_id: string | null;
	included_usage: number | "inf" | null;
	interval: string | null;
	interval_count: number | null;
	price: number | null;
	tiers: Array<{ to: number | "inf"; amount: number }> | null;
	billing_units: number | null;
}

/**
 * Convert atmn PlanFeature to ProductItem-like shape for display
 */
export const planFeatureToItem = ({
	planFeature,
}: {
	planFeature: PlanFeature;
}): ProductItemLike => {
	// Support both 'included' and legacy 'granted' field names
	const pf = planFeature as PlanFeature & { granted?: number };
	const includedValue = planFeature.included ?? pf.granted;

	// Determine interval: reset.interval > price.interval
	const interval = planFeature.reset?.interval ?? planFeature.price?.interval ?? null;
	const intervalCount = planFeature.reset?.interval_count ?? planFeature.price?.interval_count ?? null;

	return {
		feature_id: planFeature.feature_id,
		included_usage: planFeature.unlimited ? "inf" : (includedValue ?? null),
		interval,
		interval_count: intervalCount,
		price: planFeature.price?.amount ?? null,
		tiers: planFeature.price?.tiers ?? null,
		billing_units: planFeature.price?.billing_units ?? null,
	};
};

/**
 * Minimal Feature shape needed for display functions
 */
export interface FeatureLike {
	id: string;
	name: string;
	type: string;
	display?: { singular?: string; plural?: string } | null;
}

/**
 * Convert atmn Feature to FeatureLike shape for display
 */
export const featureToDisplayFeature = ({
	feature,
}: {
	feature: Feature;
}): FeatureLike => {
	return {
		id: feature.id,
		name: feature.name,
		type: feature.type,
		display: null, // atmn features don't have display config yet
	};
};
`;
}
