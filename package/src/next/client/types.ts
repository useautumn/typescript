import { Customer, CustomerData } from "src/sdk";

export interface AutumnContextParams {
  encryptedCustomerId?: string;
  customerData?: CustomerData;
  authProvider?: "clerk" | "better-auth";
  customer: Customer | null;
  setCustomer: (customer: Customer | null) => void;
  paywallExists: boolean;
}

export interface AutumnProviderProps extends AutumnContextParams {
  children?: React.ReactNode;
}
