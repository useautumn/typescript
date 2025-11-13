import { AutumnContext, useAutumnContext } from "@/AutumnContext";
import type { PricingCardOverride } from "./pricingCardTypes";
import { usePricingTableBase } from "./usePricingTableBase";

export const usePricingTable = (params?: {
	overrides?: PricingCardOverride[];
}) => {
	const context = useAutumnContext({
		AutumnContext,
		name: "usePricingTable",
	});

	return usePricingTableBase({
		client: context.client,
		params,
	});
};
