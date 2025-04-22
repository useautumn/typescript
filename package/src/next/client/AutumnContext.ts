import { createContext, useContext } from "react";
import { AutumnContextParams } from "./types";
import { Customer } from "../../sdk";
export const AutumnContext = createContext<AutumnContextParams>({
  encryptedCustomerId: "",
  customerData: {},
  authProvider: "better-auth",
  customer: null,
  setCustomer: () => {},
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
