import { findRoute } from "rou3";
import { Autumn } from "../../sdk";
import { createRouterWithOptions } from "./routes/backendRouter";
import { AuthResult } from "./utils/AuthFunction";
import { autumnApiUrl } from "./constants";
import { secretKeyCheck } from "./utils/secretKeyCheck";
import type { Elysia, Context } from "elysia";
import { toSnakeCase } from "../../utils/toSnakeCase";

export function autumnHandler(options: {
  identify: (context: any) => AuthResult | Promise<AuthResult>;
  version?: string;
  secretKey?: string;
  url?: string;
}) {
  const { found, error: resError } = secretKeyCheck(options.secretKey);
  if (!found && !options.secretKey) {
    throw new Error(resError?.message || "Secret key check failed");
  }

  const router = createRouterWithOptions();

  return function plugin(app: Elysia) {
    // Handle GET/DELETE requests (no body parsing)
    app.get("/api/autumn/*", async (context: any) => {
      return handleRequest(context);
    });

    app.delete("/api/autumn/*", async (context: any) => {
      return handleRequest(context);
    });

    // Handle POST/PUT/PATCH requests (with body parsing)
    app.post("/api/autumn/*", async (context: any) => {
      return handleRequest(context);
    });

    app.put("/api/autumn/*", async (context: any) => {
      return handleRequest(context);
    });

    app.patch("/api/autumn/*", async (context: any) => {
      return handleRequest(context);
    });

    async function handleRequest(context: any) {
      let { found, error: resError } = secretKeyCheck(options.secretKey);
      if (!found) {
        context.set.status = resError!.statusCode;
        return resError;
      }

      const autumn = new Autumn({
        url: options.url || autumnApiUrl,
        version: options.version,
        secretKey: options.secretKey,
      });

      const request = context.request;
      const url = new URL(request.url);
      const path = url.pathname;
      const searchParams = Object.fromEntries(url.searchParams);
      const method = request.method;

      const match = findRoute(router, method, path);

      if (!match) {
        context.set.status = 404;
        return { error: "Not found" };
      }

      const { data, params: pathParams } = match;
      const { handler } = data;

      let body = null;
      if (["POST", "PUT", "PATCH"].includes(method)) {
        try {
          body = context.body;
        } catch (error) {
          body = null;
        }
      }

      try {
        const result = await handler({
          autumn,
          body: toSnakeCase(body),
          path,
          getCustomer: async () => await options.identify(context),
          pathParams,
          searchParams,
        });

        context.set.status = result.statusCode;
        return result.body;
      } catch (error: any) {
        context.set.status = 500;
        return {
          error: "Internal server error",
          message: error?.message || "Unknown error",
        };
      }
    }

    return app;
  };
}
