import { Customer, CustomerData } from "src/sdk";

export class AutumnClientError {
  message: string;
  code: string;
  constructor(message: string, code: string) {
    this.message = message;
    this.code = code;
  }

  toString() {
    return `${this.message} (${this.code})`;
  }

  toJSON() {
    return {
      message: this.message,
      code: this.code,
    };
  }
}

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
