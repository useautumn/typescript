import { encryptData } from "../utils/encryptUtils";
import { CustomerData } from "../sdk";
import { AuthPluginOptions, setupAuthPlugin } from "./server/auth/authPlugin";
import { NextAutumnProvider } from "./client/NextAutumnProvider";
import React from "react";


interface AutumnProviderProps {
  customerId?: string;
  customerData?: CustomerData;
  authPlugin?: AuthPluginOptions;
  children?: React.ReactNode;
  defaultReturnUrl?: string;
}

const notNullish = (value: any) => {
  return value !== null && value !== undefined;
};

export const AutumnProvider = ({
  customerId,
  customerData,
  authPlugin,
  children,
  defaultReturnUrl,
}: AutumnProviderProps): React.JSX.Element => {
  if (typeof window !== "undefined") {
    throw new Error(
      "AutumnProvider must be used in a server component. It cannot be used in client components."
    );
  }

  if (notNullish(customerId) && notNullish(authPlugin)) {
    throw new Error(
      "AutumnProvider cannot have both customerId and authPlugin provided."
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
    <NextAutumnProvider
      encryptedCustomerId={encryptedCustomerId}
      customerData={customerData}
      defaultReturnUrl={defaultReturnUrl}
    >
      {children}
    </NextAutumnProvider>
  );
};
