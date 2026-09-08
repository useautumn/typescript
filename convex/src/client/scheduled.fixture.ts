import {
  componentsGeneric,
  type GenericActionCtx,
  type GenericDataModel,
} from "convex/server";
import { Autumn, type AutumnComponent } from "./index.js";

const components = componentsGeneric() as unknown as {
  autumn: AutumnComponent;
};

/**
 * A client configured the way an application configures one: identity comes
 * from the request's auth context.
 *
 * A scheduled call carries no original user auth, so `identify(ctx)` resolves
 * nothing there. The internal actions still run, because they take the customer
 * from the server code that invoked them.
 */
const autumn = new Autumn<GenericActionCtx<GenericDataModel>>(
  components.autumn,
  {
    secretKey: "test-secret-key",
    serverURL: "https://example.test",
    operationNamespace: "scheduled-fixture",
    identify: async (ctx) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return null;
      return { customerId: identity.subject };
    },
  }
);

export const { check } = autumn.api();
export const { track } = autumn.internalApi();
