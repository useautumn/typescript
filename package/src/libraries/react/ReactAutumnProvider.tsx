import { BaseAutumnProvider } from "./BaseAutumnProvider";
import { AutumnClient } from "./client/ReactAutumnClient";
import { CustomerData } from "../../sdk";
import { AutumnContext } from "./AutumnContext";
import { useEffect } from "react";
import { c } from "node_modules/better-call/dist/router-BEp4ze3Q.cjs";
import { apiKey } from "better-auth/plugins";

const getBackendUrl = (backendUrl?: string) => {
  if (backendUrl) {
    return backendUrl;
  }

  if (backendUrl && !backendUrl.startsWith("http")) {
    console.warn(`backendUrl is not a valid URL: ${backendUrl}`);
  }

  return "";
};

// class AutumnConvexClient extends AutumnClient {
//   private ctx: any;
//   constructor({ ctx }: { ctx: any }) {
//     super({
//       convexApi: api,
//       backendUrl: ctx.request.url,
//     });
//   }

//   attach(params) {
//     apiKey.attach(this.ctx, params)
//   }
// }
export const ReactAutumnProvider = ({
  children,
  getBearerToken,
  backendUrl,
  customerData,
  includeCredentials,
  betterAuthUrl,
  headers,
  convexApi,
}: {
  children: React.ReactNode;
  getBearerToken?: () => Promise<string | null | undefined>;
  backendUrl?: string;
  customerData?: CustomerData;
  includeCredentials?: boolean;
  betterAuthUrl?: string;
  headers?: Record<string, string>;
  convexApi?: any
}) => {
  let client = new AutumnClient({
    backendUrl: getBackendUrl(backendUrl),
    getBearerToken,
    customerData,
    includeCredentials,
    betterAuthUrl,
    headers,
  });

  // if (convexApi) {
  //   client = new AutumnConvexClient({
  //     ctx
  //   });
  // }

  return (
    <BaseAutumnProvider client={client} AutumnContext={AutumnContext}>
      {children}
    </BaseAutumnProvider>
  );
};
