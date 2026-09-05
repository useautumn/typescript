import { componentsGeneric } from "convex/server";
import { ConvexError } from "convex/values";
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

/**
 * A client whose `identify(ctx)` fails with an error named like a transport
 * failure.
 *
 * `ConnectionError`, `UnexpectedClientError`, `RequestTimeoutError` and
 * `RequestAbortedError` are Speakeasy's standard generated error names, so any
 * other Speakeasy-generated SDK identification calls raises errors carrying
 * exactly them. This one is a foreign error of that shape: Autumn never sent a
 * request, so the outcome of an Autumn operation cannot be open.
 */
class ForeignRequestTimeoutError extends Error {
  constructor() {
    super("identity service timed out");
    this.name = "RequestTimeoutError";
  }
}

const foreignTimeout = new Autumn(components.autumn, {
  secretKey: "test-secret-key",
  serverURL: "https://example.test",
  operationNamespace: "identity-fixture-timeout",
  identify: async () => {
    throw new ForeignRequestTimeoutError();
  },
});

export const { check: checkForeignTimeout } = foreignTimeout.api();

/** The data the rejecting `identify(ctx)` below sends to its caller. */
export const IDENTIFY_REJECTION = {
  code: "UNAUTHENTICATED",
  message: "Sign in before using billing.",
  attempted: { tenant: "tenant-1" },
};

/**
 * A client whose `identify(ctx)` refuses the request with a `ConvexError`.
 *
 * A `ConvexError` is how a Convex function sends structured data to its caller,
 * and `identify(ctx)` is consumer code that owns the authorization decision.
 * Classifying one as an Autumn outcome would replace the consumer's own payload
 * with this package's sanitized one and tell the caller Autumn rejected a
 * request that was never sent.
 */
const rejecting = new Autumn(components.autumn, {
  secretKey: "test-secret-key",
  serverURL: "https://example.test",
  operationNamespace: "identity-fixture-rejection",
  identify: async () => {
    throw new ConvexError(IDENTIFY_REJECTION);
  },
});

export const { check: checkRejected } = rejecting.api();
