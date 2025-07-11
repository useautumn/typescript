import { findRoute } from "rou3";
import { Autumn } from "../../sdk";
import { createRouterWithOptions } from "./routes/backendRouter";
import { AuthResult } from "./utils/AuthFunction";
import { autumnApiUrl } from "./constants";
import { secretKeyCheck } from "./utils/secretKeyCheck";
import type { Elysia } from "elysia";

export function autumnHandler(options: {
  identify: (context: any) => AuthResult;
  version?: string;
  secretKey?: string;
  url?: string;
}) {
  const autumn = new Autumn({
    url: options.url || autumnApiUrl,
    version: options.version,
  });

  const router = createRouterWithOptions();
  let { found, error: resError } = secretKeyCheck(options?.secretKey);

  return (app: Elysia) => {
    return app.onRequest(async (context) => {
      try {
        const path = context.request.url;
        const url = new URL(path);
        const pathname = url.pathname;

        if (!pathname.startsWith("/api/autumn")) {
          return;
        }

        if (!found && !options.secretKey) {
          context.set.status = resError!.statusCode;
          return resError;
        }

        const searchParams = Object.fromEntries(url.searchParams);
        const match = findRoute(router, context.request.method, pathname);

        if (!match) {
          context.set.status = 404;
          return { error: "Not found" };
        }

        const { data, params: pathParams } = match;
        const { handler } = data;

        let body = null;
        if (["POST", "PUT", "PATCH"].includes(context.request.method)) {
          try {
            body = await context.request.json();
          } catch (error) {
            // Body is optional, continue without it
          }
        }

        const result = await handler({
          autumn,
          body,
          path: pathname,
          getCustomer: async () => {
            return await options.identify(context);
          },
          pathParams,
          searchParams,
        });

        context.set.status = result.statusCode;
        return result.body;
      } catch (error) {
        console.error("Error handling Autumn request:", error);
        context.set.status = 500;
        return { error: "Internal server error" };
      }
    });
  };
}
