import { createAuthEndpoint } from "better-auth/plugins";
import type {
  AuthContext,
  BetterAuthPlugin,
  Endpoint,
  EndpointContext,
  Method,
} from "better-auth";
import { createRouterWithOptions } from "./routes/backendRouter";
import { secretKeyCheck } from "./utils/secretKeyCheck";
import { Autumn } from "@sdk";
import { findRoute } from "rou3";
import { sessionMiddleware } from "better-auth/api";

const router = createRouterWithOptions();
const handleReq = async (ctx: EndpointContext<any, any, AuthContext>) => {
  let { found, error: resError } = secretKeyCheck();
  if (!found) {
    return ctx.json({ error: resError }, { status: resError!.statusCode });
  }

  const req = ctx.request as Request;
  const method = req.method;
  const url = new URL(req.url);
  const searchParams = Object.fromEntries(url.searchParams);
  let pathname = url.pathname;
  pathname = pathname.replace("/api/auth", "");

  const match = findRoute(router, method, pathname);

  if (!match) {
    return ctx.json({ error: "Not found" }, { status: 404 });
  }

  const autumn = new Autumn({
    url: "http://localhost:8080/v1",
  });
  const { data, params: pathParams } = match;
  const { handler } = data;

  const body = ctx.body;
  const session = ctx.context.session;

  const identify = async () => {
    if (!session) {
      return;
    }
    return {
      customerId: session.user.id,
      customerData: {
        email: session.user.email,
        name: session.user.name,
      },
    };
  };

  const result = await handler({
    autumn,
    body,
    path: url,
    getCustomer: identify,
    pathParams,
    searchParams,
  });

  return ctx.json(result.body, { status: result.statusCode });
};

const createAutumnEndpoints = () => {
  const endpoints: Record<string, Endpoint> = {};
  for (const route of Object.keys(router.static)) {
    const methods = Object.keys(router.static[route]?.methods || {});

    let func = route.replace("/api/autumn/", "");
    func = func.replace(/\//g, "");
    func = func.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
    func = func.replace(/[-_]/g, "");

    for (const method of methods) {
      let methodFunc =
        method.toLowerCase() + func[0].toUpperCase() + func.slice(1);
      endpoints[methodFunc] = createAuthEndpoint(
        route,
        {
          method: method as Method,
          use: [sessionMiddleware],
        },
        async (ctx) => await handleReq(ctx)
      ) as Endpoint;
    }
  }

  return endpoints;
};

export const autumn = () =>
  ({
    id: "autumn",
    endpoints: createAutumnEndpoints(),
  }) satisfies BetterAuthPlugin;
