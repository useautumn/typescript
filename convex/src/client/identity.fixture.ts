import { componentsGeneric } from "convex/server";
import { ConvexError } from "convex/values";
import {
  AutumnError,
  ConnectionError,
  RequestAbortedError,
  RequestTimeoutError,
  ResponseValidationError,
  SDKValidationError,
  UnexpectedClientError,
} from "autumn-js";
import { AutumnIndeterminateError } from "../errors.js";
import { Autumn, type AutumnComponent } from "./index.js";

const components = componentsGeneric() as unknown as {
  autumn: AutumnComponent;
};

function checkForIdentifyError(error: Error, operationNamespace: string) {
  const client = new Autumn(components.autumn, {
    secretKey: "test-secret-key",
    serverURL: "https://example.test",
    operationNamespace,
    identify: async () => {
      throw error;
    },
  });
  return client.api().check;
}

function httpMetadata(status: number) {
  return {
    response: new Response("provider failure", { status }),
    request: new Request("https://example.test/v1/check"),
    body: "provider failure",
  };
}

/**
 * A client whose `identify(ctx)` fails with a status-bearing error.
 *
 * Consumer code reaches this shape whenever identification consults a service of
 * its own: the failure carries that service's status, and Autumn never sent it.
 * The callback boundary has to remove that status before the generated action
 * classifies provider and transport errors.
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

export const checkIndeterminate = checkForIdentifyError(
  new AutumnIndeterminateError("check", 503),
  "identity-fixture-indeterminate"
);
export const checkAutumnError = checkForIdentifyError(
  new AutumnError("provider failure", httpMetadata(503)),
  "identity-fixture-autumn-error"
);
export const checkConnectionError = checkForIdentifyError(
  new ConnectionError("connection failed"),
  "identity-fixture-connection-error"
);
export const checkUnexpectedClientError = checkForIdentifyError(
  new UnexpectedClientError("unexpected client failure"),
  "identity-fixture-unexpected-error"
);
export const checkRequestTimeoutError = checkForIdentifyError(
  new RequestTimeoutError("request timed out"),
  "identity-fixture-request-timeout"
);
export const checkRequestAbortedError = checkForIdentifyError(
  new RequestAbortedError("request aborted"),
  "identity-fixture-request-aborted"
);
export const checkSdkValidationError = checkForIdentifyError(
  new SDKValidationError(
    "request validation failed",
    new Error("validation cause"),
    { private: "identity input" }
  ),
  "identity-fixture-sdk-validation"
);
export const checkResponseValidationError = checkForIdentifyError(
  new ResponseValidationError("response validation failed", {
    ...httpMetadata(503),
    cause: new Error("validation cause"),
    rawValue: { private: "identity response" },
    rawMessage: "invalid identity response",
  }),
  "identity-fixture-response-validation"
);

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
