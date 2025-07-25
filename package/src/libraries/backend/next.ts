import { findRoute } from "rou3";
import { Autumn } from "../../sdk";

import { NextRequest, NextResponse } from "next/server";
import { AuthResult } from "./utils/AuthFunction";
import { createRouterWithOptions } from "./routes/backendRouter";
import { autumnApiUrl } from "./constants";
import { secretKeyCheck } from "./utils/secretKeyCheck";

export function autumnHandler(options: {
  identify: (request: any) => AuthResult;
  url?: string;
  secretKey?: string;
}) {
  const router = createRouterWithOptions();

  async function handler(request: any, response?: any) {
    let { found, error: resError } = secretKeyCheck(options.secretKey);

    // Check if this is pages router by looking for NextApiRequest properties
    const isPagesRouter =
      response && "query" in request && "cookies" in request;

    if (!found) {
      if (isPagesRouter) {
        return response.status(resError!.statusCode).json(resError);
      } else {
        return NextResponse.json(resError, { status: resError!.statusCode });
      }
    }

    const autumn = new Autumn({
      secretKey: options.secretKey || undefined,
      url: options.url || autumnApiUrl,
    });

    if (!found) {
      if (isPagesRouter) {
        return response.status(500).json(resError);
      } else {
        return NextResponse.json(resError, { status: 500 });
      }
    }

    const method = request.method;

    // Handle both app router (full URL) and pages router (pathname only)
    let url: URL;
    if (!request.url.includes("http")) {
      // Pages router
      url = new URL(request.url, "http://localhost:3000");
    } else {
      url = new URL(request.url);
    }

    const searchParams = Object.fromEntries(url.searchParams);
    const pathname = url.pathname;

    const match = findRoute(router, method, pathname);

    if (!match) {
      if (isPagesRouter) {
        return response.status(404).json({ error: "Not found" });
      } else {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const { data, params: pathParams } = match;
    const { handler } = data;

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
      getCustomer: async () => await options.identify(request),
      pathParams,
      searchParams,
    });

    if (isPagesRouter) {
      return response.status(result.statusCode).json(result.body);
    } else {
      return NextResponse.json(result.body, { status: result.statusCode });
    }
  }

  return {
    GET: handler,
    POST: handler,
  };
}
