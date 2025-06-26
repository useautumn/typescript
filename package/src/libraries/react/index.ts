export { ReactAutumnProvider as AutumnProvider } from "./ReactAutumnProvider";

// Hooks
export { useCustomer } from "./hooks/useCustomer";

export { usePricingTable } from "./hooks/usePricingTable";
export { useEntity } from "./hooks/useEntity";

/** @deprecated Functions exported from useAutumn have been moved to useCustomer */
export { useAutumn } from "./hooks/useAutumn";

// Auto-synced components
export { default as AttachDialog } from "./components/attach-dialog/attach-dialog-synced";
export { default as CheckDialog } from "./components/check-dialog/check-dialog-synced";
