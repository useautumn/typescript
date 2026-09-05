import { componentsGeneric } from "convex/server";
import { Autumn, type AutumnComponent } from "./index.js";

const components = componentsGeneric() as unknown as {
  autumn: AutumnComponent;
};

/**
 * A client whose `identify(ctx)` fails with a status-bearing error.
 *
 * Consumer code reaches this shape whenever identification consults a service of
 * its own: the failure carries that service's status, and Autumn never sent it.
 * `identify(ctx)` runs inside the region a generated action classifies, so this
 * is where a status read off any error at all would be attributed to Autumn.
 */
const unidentified = new Autumn(components.autumn, {
  secretKey: "test-secret-key",
  serverURL: "https://example.test",
  operationNamespace: "identity-fixture",
  identify: async () => {
    throw Object.assign(new Error("identity service unavailable"), {
      statusCode: 503,
    });
  },
});

export const { check } = unidentified.api();
