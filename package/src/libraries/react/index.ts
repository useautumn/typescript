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
export { default as AttachDialog } from "./components/attach-dialog/attach-dialog-synced";
export { default as CheckDialog } from "./components/check-dialog/check-dialog-synced";
export { default as PricingTable } from "./components/pricing-table/pricing-table-synced";
