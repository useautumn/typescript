// Import CSS for tsup injectStyle
import "../../styles/global.css";

export type { Plan as PricingTableProduct } from "@useautumn/sdk/resources/shared";
export type { ProductDetails } from "./client/types/clientPricingTableTypes";
export type { PricingTablePlan, PlanProperties } from "./hooks/usePricingTableBase";
export { useAggregateEvents } from "./hooks/useAggregateEvents";

/** @deprecated Use useAggregateEvents or useListEvents instead */
export { useAnalytics } from "./hooks/useAnalytics";
export { useCustomer } from "./hooks/useCustomer";
export { useEntity } from "./hooks/useEntity";
export { useListEvents } from "./hooks/useListEvents";
export { usePaywall } from "./hooks/usePaywall";
export { usePricingTable } from "./hooks/usePricingTable";
export { ReactAutumnProvider as AutumnProvider } from "./ReactAutumnProvider";

/** @deprecated */
export const useAutumn = () => {};

// Auto-synced components
export { default as CheckoutDialog } from "./components/checkout-dialog/checkout-dialog-synced";
export { default as PaywallDialog } from "./components/paywall-dialog/paywall-dialog-synced";
export { default as PricingTable } from "./components/pricing-table/pricing-table-synced";
