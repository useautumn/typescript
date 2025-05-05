import { AutumnClientProvider } from "./client/AutumnProvider";
import { encryptData } from "../utils/encryptUtils";
import { CustomerData } from "src/sdk";
import { AuthPluginOptions, setupAuthPlugin } from "./server/auth/authPlugin";

interface AutumnProviderProps {
  customerId?: string;
  customerData?: CustomerData;
  children?: React.ReactNode;
  authPlugin?: AuthPluginOptions;
  components?: {
    paywallDialog?: () => JSX.Element | React.ReactNode;
    productChangeDialog?: () => JSX.Element | React.ReactNode;
  };
}

export const AutumnProvider = ({
  customerId,
  customerData,
  authPlugin,
  children,
  components,
}: AutumnProviderProps) => {
  if (typeof window !== "undefined") {
    throw new Error(
      "AutumnProvider must be used in a server component. It cannot be used in client components."
    );
  }

  let encryptedCustomerId = customerId ? encryptData(customerId) : undefined;

  if (authPlugin) {
    setupAuthPlugin({
      useUser: true,
      ...authPlugin,
    });
  }

  return (
    <AutumnClientProvider
      encryptedCustomerId={encryptedCustomerId}
      customerData={customerData}
      components={components}
    >
      {children}
    </AutumnClientProvider>
  );
};
