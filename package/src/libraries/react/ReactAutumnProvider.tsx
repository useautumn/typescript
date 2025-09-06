import { BaseAutumnProvider } from "./BaseAutumnProvider";
import { AutumnClient } from "./client/ReactAutumnClient";
import { CustomerData } from "../../sdk";
import { AutumnContext } from "./AutumnContext";
import { IAutumnClient } from "./client/ReactAutumnClient";
import { ConvexAutumnClient } from "./client/ConvexAutumnClient";

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
  convex,
  backendUrl,
  customerData,
  includeCredentials,
  betterAuthUrl,
  headers,
  convexApi,
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
}) => {
  let client: IAutumnClient = convexApi
    ? new ConvexAutumnClient({
        convex,
        convexApi,
        customerData,
        headers,
        getBearerToken,
      })
    : new AutumnClient({
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
