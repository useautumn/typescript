import { AuthResult } from "./utils/AuthFunction";
import { createRouterWithOptions } from "./routes/backendRouter";

import { secretKeyCheck } from "./utils/secretKeyCheck";
import { Autumn } from "@sdk";
import { findRoute } from "rou3";

export function autumnHandler(options: {
  httpAction: any;
  identify: (ctx: any, request: any) => AuthResult;
  url?: string;
  secretKey?: string;
  clientOrigin?: string;
}) {
  const router = createRouterWithOptions();

  return options.httpAction(async (ctx: any, request: Request) => {
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          // e.g. https://mywebsite.com, configured on your Convex dashboard, or passed in as an option
          "Access-Control-Allow-Origin":
            options.clientOrigin ??
            process.env.CLIENT_ORIGIN ??
            "http://localhost:3000",
          "Access-Control-Allow-Methods": "POST, GET, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Digest, Authorization, Cookie",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }),
      });
    }

    let { found, error: resError } = secretKeyCheck(options.secretKey);

    if (!found && !options.secretKey) {
      return Response.json(resError, { status: resError!.statusCode });
    }

    const method = request.method;
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams);
    const pathname = url.pathname;
    const match = findRoute(router, method, pathname);

    if (!match) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const { data, params: pathParams } = match;
    const { handler } = data;

    const autumn = new Autumn({
      secretKey: options.secretKey || undefined,
      url: options.url,
    });

    let body = null;
    if (method === "POST" || method === "PUT" || method === "PATCH") {
      try {
        body = await request.json();
      } catch (error) {}
    }

    const result = await handler({
      autumn,
      body,
      path: url.pathname,
      getCustomer: async () => await options.identify(ctx, request),
      pathParams,
      searchParams,
    });

    return Response.json(result.body, {
      status: result.statusCode,
      headers: new Headers({
        "Access-Control-Allow-Origin":
          options.clientOrigin ??
          process.env.CLIENT_ORIGIN ??
          "http://localhost:3000",
        "Access-Control-Allow-Credentials": "true",
        Vary: "origin",
      }),
    });
  });
}
