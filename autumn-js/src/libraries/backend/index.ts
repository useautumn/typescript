import { Autumn } from "@sdk";
import { createRouterWithOptions } from "./routes/backendRouter";
import { secretKeyCheck } from "./utils/secretKeyCheck";
import { findRoute } from "rou3";

// Re-export Autumn type to ensure users import from the same module path
export { Autumn };

export async function autumnHandler(options: {
  request: {
    url: string;
    method: string;
    body: any;
  };

  // Customer data...
  customerId?: string;
  customerData?: {
    name?: string;
    email?: string;
  };

  clientOptions?: {
    secretKey?: string;
    baseURL?: string;
  };
}) {
  const router = createRouterWithOptions();

  let { found, error: resError } = secretKeyCheck(
    options?.clientOptions?.secretKey
  );

  if (!found) {
    return {
      statusCode: 500,
      response: resError,
    };
  }

  const autumn = new Autumn({
    secretKey: options.clientOptions?.secretKey,
    baseURL: options.clientOptions?.baseURL,
  });

  const { method, url: requestUrl, body } = options.request;

  let url: URL;
  if (!requestUrl.includes("http")) {
    url = new URL(requestUrl, "http://localhost:3000");
  } else {
    url = new URL(requestUrl);
  }
  const match = findRoute(router, method, url.pathname);
  const searchParams = Object.fromEntries(url.searchParams);

  if (!match) {
    return {
      statusCode: 404,
      response: { error: "Not found" },
    };
  }

  const { data, params: pathParams } = match;
  const { handler } = data;

  const result = await handler({
    autumn,
    body,
    path: url.pathname,
    getCustomer: async () => {
      return {
        customerId: options.customerId,
        customerData: options.customerData,
      };
    },
    pathParams,
    searchParams,
  });

  return {
    statusCode: result.statusCode,
    response: result.body,
  };
}
