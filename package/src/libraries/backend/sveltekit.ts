import { findRoute } from "rou3";
import { Autumn } from "../../sdk";
import { createRouterWithOptions } from "./routes/backendRouter";
import { AuthResult } from "./utils/AuthFunction";
import { autumnApiUrl } from "./constants";
import { secretKeyCheck } from "./utils/secretKeyCheck";

// SvelteKit types - using generic types to avoid requiring @sveltejs/kit as dependency
type RequestEvent = {
  request: Request;
  url: URL;
  params: Record<string, string>;
  cookies: {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: any): void;
    delete(name: string, options?: any): void;
  };
  locals: Record<string, any>;
};

type RequestHandler = (event: RequestEvent) => Promise<Response> | Response;

export type AutumnSvelteKitHandlerOptions = {
  identify: (event: RequestEvent) => AuthResult;
  url?: string;
  version?: string;
  secretKey?: string;
};

/**
 * Creates an Autumn handler for SvelteKit API routes.
 * 
 * @example
 * ```typescript
 * // src/routes/api/autumn/[...path]/+server.ts
 * import { autumnHandler } from 'autumn-js/sveltekit';
 * 
 * const handler = autumnHandler({
 *   identify: async (event) => {
 *     const session = await event.locals.auth();
 *     if (!session?.user?.id) return null;
 *     return {
 *       customerId: session.user.id,
 *       customerData: {
 *         name: session.user.name,
 *         email: session.user.email,
 *       }
 *     };
 *   }
 * });
 * 
 * export const GET = handler.GET;
 * export const POST = handler.POST;
 * ```
 */
export function autumnHandler(options: AutumnSvelteKitHandlerOptions): {
  GET: RequestHandler;
  POST: RequestHandler;
} {
  const router = createRouterWithOptions();

  const { found, error: resError } = secretKeyCheck(options?.secretKey);

  const handler: RequestHandler = async (event) => {
    if (!found && !options?.secretKey) {
      return Response.json(resError, { status: resError!.statusCode });
    }

    const autumn = new Autumn({
      url: options?.url || autumnApiUrl,
      version: options?.version,
    });

    const request = event.request;
    const url = event.url;
    const method = request.method;
    const pathname = url.pathname;
    const searchParams = Object.fromEntries(url.searchParams);

    const match = findRoute(router, method, pathname);

    if (!match) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const { data, params: pathParams } = match;
    const { handler: routeHandler } = data;

    let body = null;
    if (method === "POST" || method === "PUT" || method === "PATCH") {
      try {
        body = await request.json();
      } catch (_) {
        // Body parsing failed, continue with null body
      }
    }

    try {
      const result = await routeHandler({
        autumn,
        body,
        path: pathname,
        getCustomer: async () => await options.identify(event),
        pathParams,
        searchParams,
      });

      return Response.json(result.body, { status: result.statusCode });
    } catch (error) {
      console.error("[Autumn] Error handling request:", error);
      return Response.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };

  return {
    GET: handler,
    POST: handler,
  };
}

