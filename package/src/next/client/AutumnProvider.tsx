import { Customer } from "src/sdk";
import { CustomerData } from "src/sdk";
import { AutumnContext } from "./AutumnContext";
import { AutumnContextParams } from "./types";
import { useState } from "react";

export interface AutumnProviderProps {
  children?: React.ReactNode;
  encryptedCustomerId?: string;
  customerData?: CustomerData;
}

export const AutumnClientProvider = ({
  children,
  encryptedCustomerId,
  customerData,
}: AutumnProviderProps) => {
  let [customer, setCustomer] = useState<Customer | null>(null);
  return (
    <AutumnContext.Provider
      value={{
        encryptedCustomerId,
        customerData,
        customer,
        setCustomer,
      }}
    >
      {children}
    </AutumnContext.Provider>
  );
};
