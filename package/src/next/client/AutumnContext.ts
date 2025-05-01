import { createContext, useContext } from "react";
import { AutumnContextParams } from "./types";
import { Customer } from "../../sdk";
// AutumnContextParams
export const AutumnContext = createContext<any>({
  encryptedCustomerId: "",
  customerData: {},
  authProvider: "better-auth",
  customer: null,
  setCustomer: () => {},
  paywallOpen: false,
  setPaywallOpen: () => {},
});

export const useAutumnContext = () => {
  const context = useContext(AutumnContext);

  if (context === undefined) {
    throw new Error(
      "useAutumnContext must be used within a AutumnContextProvider"
    );
  }

  return context;
};
