import { BaseAutumnProvider } from "./BaseAutumnProvider";
import { AutumnClient } from "./client/ReactAutumnClient";
import { CustomerData } from "../../sdk";
import { AutumnContext } from "./AutumnContext";
import { IAutumnClient } from "./client/ReactAutumnClient";
import { ConvexAutumnClient } from "./client/ConvexAutumnClient";
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
  convex,
  backendUrl,
  customerData,
  includeCredentials,
  betterAuthUrl,
  headers,
  convexApi,
  pathPrefix,
  suppressLogs,
}: {
  children: React.ReactNode;
  getBearerToken?: () => Promise<string | null>;
  convex?: any;
  backendUrl?: string;
  customerData?: CustomerData;
  includeCredentials?: boolean;
  betterAuthUrl?: string;
  headers?: Record<string, string>;
  convexApi?: any; // The exported autumn.api() object from Convex
  pathPrefix?: string; // Optional path prefix to override default "/api/autumn"
  suppressLogs?: boolean; // Suppress error logging to browser console
}): React.JSX.Element => {
  let client: IAutumnClient = convexApi
    ? new ConvexAutumnClient({
        convex,
        convexApi,
        customerData,
        headers,
        getBearerToken,
        suppressLogs,
      })
    : new AutumnClient({
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
