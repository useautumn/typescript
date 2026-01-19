import { findRoute } from "rou3";
import { Autumn } from "../../sdk";
import { AuthResult } from "./utils/AuthFunction";
import { createRouterWithOptions } from "./routes/backendRouter";
import { autumnApiUrl } from "./constants";
import { secretKeyCheck } from "./utils/secretKeyCheck";

export function autumnHandler(options: {
  identify: (args: any) => AuthResult;
  secretKey?: string;
  version?: string;
}) {
  const autumn = new Autumn({
    secretKey: options.secretKey || undefined,
    url: autumnApiUrl,
  });

  const router = createRouterWithOptions();

  let { found, error: resError } = secretKeyCheck(options?.secretKey);
  async function handleRequest(args: any) {
    if (!found && !options.secretKey) {
      throw new Response(JSON.stringify(resError!), {
        status: resError!.statusCode,
      });
    }

    const method = args.request.method;
    const url = new URL(args.request.url);
    const searchParams = Object.fromEntries(url.searchParams);
    const pathname = url.pathname;

    const match = findRoute(router, method, pathname);

    if (!match) {
      throw new Response("Not found", { status: 404 });
    }

    const { data, params: pathParams } = match;
    const { handler } = data;

    let body = null;
    if (method === "POST" || method === "PUT" || method === "PATCH") {
      try {
        body = await args.request.json();
      } catch (error) {
        // Body parsing failed, leave as null
      }
    }

    const result = await handler({
      autumn,
      body,
      path: url.pathname,
      getCustomer: async () => await options.identify(args),
      pathParams: { ...pathParams, ...args.params },
      searchParams,
    });

    return new Response(JSON.stringify(result.body), {
      status: result.statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async function loader(args: any) {
    if (args.request.method !== "GET") {
      throw new Response("Method not allowed", { status: 405 });
    }

    const response = await handleRequest(args);
    const data = await response.json();

    if (!response.ok) {
      throw new Response(JSON.stringify(data), { status: response.status });
    }

    return data;
  }

  async function action(args: any) {
    if (args.request.method === "GET") {
      throw new Response("Method not allowed", { status: 405 });
    }

    const response = await handleRequest(args);
    const data = await response.json();

    if (!response.ok) {
      throw new Response(JSON.stringify(data), { status: response.status });
    }

    return data;
  }

  return {
    loader,
    action,
  };
}
