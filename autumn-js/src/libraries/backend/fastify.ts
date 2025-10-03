import { findRoute } from "rou3";
import { Autumn } from "@sdk";
import { createRouterWithOptions } from "./routes/backendRouter";
import { AuthResult } from "./utils/AuthFunction";
import { autumnApiUrl } from "./constants";
import { secretKeyCheck } from "./utils/secretKeyCheck";

export function autumnHandler(options: {
  identify: (request: any) => AuthResult;
  version?: string;
  secretKey?: string;
  baseURL?: string;
}) {
  const autumn = new Autumn({
    baseURL: autumnApiUrl,
    apiVersion: options.version,
  });

  const router = createRouterWithOptions();

  let { found, error: resError } = secretKeyCheck(options?.secretKey);

  return async function (request: any, reply: any) {
    try {
      if (!found && !options.secretKey) {
        return reply.code(resError!.statusCode).send(resError);
      }

      const url = new URL(request.url, `http://${request.headers.host}`);
      const path = url.pathname;

      const searchParams = Object.fromEntries(
        new URLSearchParams(request.query)
      );

      const match = findRoute(router, request.method, path);

      if (!match) {
        return reply.code(404).send({ error: "Not found" });
      }

      const { data, params: pathParams } = match;
      const { handler } = data;

      let body = null;
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        body = request.body;
      }

      const result = await handler({
        autumn,
        body,
        path,
        pathParams,
        searchParams,
        getCustomer: async () => {
          return await options.identify(request);
        },
      });

      // Send response
      return reply.code(result.statusCode).send(result.body);
    } catch (error) {
      console.error("Error handling Autumn request:", error);
      return reply.code(500).send({ error: "Internal server error" });
    }
  };
}
