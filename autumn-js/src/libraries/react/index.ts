// Import CSS for tsup injectStyle
import "../../styles/global.css";

// export type { PricingTableProduct } from "@sdk/components/componentTypes";

export { useAnalytics } from "./hooks/useAnalytics";
export { useCustomer } from "./hooks/useCustomer";
export { useEntity } from "./hooks/useEntity";
export { usePaywall } from "./hooks/usePaywall";
export { usePricingTable } from "./hooks/usePricingTable/usePricingTable";
export { ReactAutumnProvider as AutumnProvider } from "./ReactAutumnProvider";

/** @deprecated */
export const useAutumn = () => {};

// Auto-synced components
export { default as CheckoutDialog } from "./components/checkout-dialog/checkout-dialog-synced";
export { default as PaywallDialog } from "./components/paywall-dialog/paywall-dialog-synced";
export { default as PricingTable } from "./components/pricing-table/pricing-table-synced";
export type {
	PricingCardData,
	PricingCardOverride,
} from "./hooks/usePricingTable/pricingCardTypes";
