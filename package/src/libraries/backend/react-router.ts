import { findRoute } from "rou3";
import { Autumn } from "../../sdk";
import { AuthResult } from "./utils/AuthFunction";
import { createRouterWithOptions } from "./routes/backendRouter";
import { autumnApiUrl } from "./constants";

export function autumnHandler(options: {
  secretKey?: string;
  identify: (args: {
    request: Request;
    params: Record<string, string>;
  }) => AuthResult;
  version?: string;
}) {
  const autumn = new Autumn({
    secretKey: options.secretKey || undefined,
    url: autumnApiUrl,
  });

  const router = createRouterWithOptions();

  async function handleRequest(
    request: Request,
    params: Record<string, string> = {}
  ) {
    const method = request.method;
    const url = new URL(request.url);
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
        body = await request.json();
      } catch (error) {
        // Body parsing failed, leave as null
      }
    }

    const result = await handler({
      autumn,
      body,
      path: url.pathname,
      getCustomer: async () => await options.identify({ request, params }),
      pathParams: { ...pathParams, ...params },
      searchParams,
    });

    return new Response(JSON.stringify(result.body), {
      status: result.statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async function loader({
    request,
    params,
  }: {
    request: Request;
    params: Record<string, string>;
  }) {
    if (request.method !== "GET") {
      throw new Response("Method not allowed", { status: 405 });
    }

    const response = await handleRequest(request, params);
    const data = await response.json();

    if (!response.ok) {
      throw new Response(JSON.stringify(data), { status: response.status });
    }

    return data;
  }

  async function action({
    request,
    params,
  }: {
    request: Request;
    params: Record<string, string>;
  }) {
    if (request.method === "GET") {
      throw new Response("Method not allowed", { status: 405 });
    }

    const response = await handleRequest(request, params);
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
