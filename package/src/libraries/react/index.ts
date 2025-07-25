// Import CSS for tsup injectStyle
import "../../styles/global.css";

export { ReactAutumnProvider as AutumnProvider } from "./ReactAutumnProvider";

export type { PricingTableProduct } from "@sdk/components/componentTypes";
export type { ProductDetails } from "./client/types/clientPricingTableTypes";

export { useCustomer } from "./hooks/useCustomer";
export { usePricingTable } from "./hooks/usePricingTable";
export { useEntity } from "./hooks/useEntity";
export { useAnalytics } from "./hooks/useAnalytics";
export { usePaywall } from "./hooks/usePaywall";

/** @deprecated */
export const useAutumn = () => {};

// Auto-synced components
export { default as CheckoutDialog } from "./components/checkout-dialog/checkout-dialog-synced";
export { default as PaywallDialog } from "./components/paywall-dialog/paywall-dialog-synced";
export { default as PricingTable } from "./components/pricing-table/pricing-table-synced";
