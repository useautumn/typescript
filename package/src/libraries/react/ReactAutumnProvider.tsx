import { BaseAutumnProvider } from "./BaseAutumnProvider";
import {
  AutumnClient,
  type IAutumnClient,
} from "./client/ReactAutumnClient";
import { CustomerData } from "../../sdk";
import { AutumnContext } from "./AutumnContext";
import React from "react";

const getBackendUrl = (backendUrl?: string) => {
  if (backendUrl) {
    return backendUrl;
  }

  if (backendUrl && !backendUrl.startsWith("http")) {
    console.warn(`backendUrl is not a valid URL: ${backendUrl}`);
  }

  return "";
};

export const ReactAutumnProvider = ({
  children,
  getBearerToken,
  backendUrl,
  customerData,
  includeCredentials,
  betterAuthUrl,
  headers,
  pathPrefix,
  suppressLogs,
}: {
  children: React.ReactNode;
  getBearerToken?: () => Promise<string | null>;
  backendUrl?: string;
  customerData?: CustomerData;
  includeCredentials?: boolean;
  betterAuthUrl?: string;
  headers?: Record<string, string>;
  pathPrefix?: string; // Optional path prefix to override default "/api/autumn"
  suppressLogs?: boolean; // Suppress error logging to browser console
}): React.JSX.Element => {
  const client: IAutumnClient = new AutumnClient({
    backendUrl: getBackendUrl(backendUrl),
    getBearerToken,
    customerData,
    includeCredentials,
    betterAuthUrl,
    headers,
    pathPrefix: pathPrefix,
    suppressLogs,
  });

  return (
    <BaseAutumnProvider client={client} AutumnContext={AutumnContext}>
      {children}
    </BaseAutumnProvider>
  );
};
