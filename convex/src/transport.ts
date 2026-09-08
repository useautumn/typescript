import {
  AutumnError,
  Autumn as AutumnSDK,
  ConnectionError,
  HTTPClient,
  RequestAbortedError,
  RequestTimeoutError,
  ResponseValidationError,
  SDKValidationError,
  UnexpectedClientError,
} from "autumn-js";
import {
  AutumnConfigurationError,
  AutumnIndeterminateError,
} from "./errors.js";
import { validateJsonRequest } from "./serialization.js";

const API_VERSION = "2.3.0";
const PROTECTED_HEADERS = new Set([
  "authorization",
  "content-type",
  "x-api-version",
  "idempotency-key",
]);

/**
 * The debug logger every SDK client receives, which discards what it is given.
 *
 * The SDK falls back to `console` whenever no logger is supplied and
 * `AUTUMN_DEBUG` is set. Its request logger prints every header, including the
 * `Authorization` bearer token, and both its request and response loggers print
 * bodies; in Convex that console is the deployment log. Transport policy is
 * pinned here rather than taken from the environment, so this logger is pinned
 * with it and an operator cannot turn provider payloads into log output by
 * setting a variable.
 */
const SILENT_LOGGER = {
  group: () => {},
  groupEnd: () => {},
  log: () => {},
};

export type AutumnTransportOptions = {
  secretKey?: string;
  serverURL?: string;
  headers?: HeadersInit;
  fetcher?: typeof fetch;
  timeoutMs?: number;
};

export type AutumnCall = {
  sdk: AutumnSDK;
  requestOptions: {
    retries: { strategy: "none" };
    headers?: Record<string, string>;
  };
  status: () => number | undefined;
};

function validatedHeaders(input?: HeadersInit): Headers {
  const headers = new Headers(input);
  headers.forEach((_value, name) => {
    if (PROTECTED_HEADERS.has(name.toLowerCase())) {
      throw new AutumnConfigurationError(
        `The ${name} header is managed by @useautumn/convex.`
      );
    }
  });
  return headers;
}

/**
 * A response body this package could not read, carrying the status the server
 * had already sent.
 *
 * The status line arrives before the body, so a truncated body never erases what
 * the server decided. The SDK wraps this error in a native `UnexpectedClientError`
 * and keeps it as that error's `cause`, which is where
 * {@link responseReadStatus} reads the status back from.
 */
class AutumnResponseReadError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number) {
    super("The Autumn response body could not be read.");
    this.name = "AutumnResponseReadError";
    this.statusCode = statusCode;
  }
}

/**
 * The status a failed body read carried, or `undefined` for any other error.
 *
 * Only this package's own error is unwrapped, and only one level deep, so no
 * status is ever inferred from an error this package did not create.
 */
function responseReadStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    error.cause instanceof AutumnResponseReadError
  ) {
    return error.cause.statusCode;
  }
  return undefined;
}

/**
 * Whether a status leaves the outcome of a mutation open.
 *
 * A 2xx that could not be decoded, a 409 the provider may have applied under an
 * earlier key and a 5xx all describe work that may or may not have happened.
 * Every other status is a decision the server made and kept.
 */
function isAmbiguousStatus(statusCode: number): boolean {
  return (
    (statusCode >= 200 && statusCode < 300) ||
    statusCode === 409 ||
    statusCode >= 500
  );
}

/**
 * Read the response body here, before the SDK's own matcher reads it.
 *
 * The SDK reads the body of a failed response unguarded, so a server that sends
 * its headers and then truncates the body makes that read throw where nothing
 * catches it: the observed status is lost, and the SDK's secondary result promise
 * rejects with no handler attached. Reading a clone keeps that failure inside the
 * guarded fetcher path for every status and leaves the original body for the SDK.
 * Only a success body has to be JSON, because no result is decoded from a failure
 * body.
 */
async function requireReadableBody(response: Response): Promise<void> {
  let body: string;
  try {
    body = await response.clone().text();
  } catch {
    throw new AutumnResponseReadError(response.status);
  }
  if (response.status < 200 || response.status >= 300) return;
  try {
    JSON.parse(body);
  } catch {
    throw new AutumnResponseReadError(response.status);
  }
}

export class AutumnTransport {
  private readonly customHeaders: Headers;

  constructor(private readonly options: AutumnTransportOptions) {
    this.customHeaders = validatedHeaders(options.headers);
  }

  createCall(providerKey?: string): AutumnCall {
    const secretKey = this.options.secretKey ?? process.env.AUTUMN_SECRET_KEY;
    if (!secretKey) {
      throw new AutumnConfigurationError(
        "Set secretKey or AUTUMN_SECRET_KEY before calling Autumn."
      );
    }

    let responseStatus: number | undefined;
    const fetcher = this.options.fetcher ?? fetch;
    const customHeaders = this.customHeaders;
    const httpClient = new HTTPClient({
      fetcher: async (input, init) => {
        const request = new Request(input, init);
        const headers = new Headers(request.headers);
        customHeaders.forEach((value, name) => headers.set(name, value));
        const response = await fetcher(new Request(request, { headers }));
        responseStatus = response.status;
        await requireReadableBody(response);
        return response;
      },
    });

    return {
      sdk: new AutumnSDK({
        secretKey,
        xApiVersion: API_VERSION,
        failOpen: false,
        serverURL: this.options.serverURL,
        retryConfig: { strategy: "none" },
        timeoutMs: this.options.timeoutMs,
        debugLogger: SILENT_LOGGER,
        httpClient,
      }),
      requestOptions: {
        retries: { strategy: "none" },
        ...(providerKey ? { headers: { "Idempotency-Key": providerKey } } : {}),
      },
      status: () => responseStatus,
    };
  }
}

export async function invokeNative<T>(
  operation: string,
  call: AutumnCall,
  request: unknown,
  invoke: (sdk: AutumnSDK, options: AutumnCall["requestOptions"]) => Promise<T>
): Promise<T> {
  validateJsonRequest(operation, request);
  try {
    const result = await invoke(call.sdk, call.requestOptions);
    if (call.status() === 202) {
      throw new AutumnIndeterminateError(operation, 202);
    }
    return result;
  } catch (error) {
    if (error instanceof AutumnIndeterminateError) throw error;
    const statusCode = call.status();
    if (statusCode !== undefined && statusCode >= 200 && statusCode < 300) {
      throw new AutumnIndeterminateError(operation, statusCode);
    }
    // A body that never arrived leaves the status the server sent as the only
    // account of the outcome. The SDK reports the failed read as a client error
    // with no status of its own, so an ambiguous one has to be recovered here:
    // a direct method throws this error to its caller unconverted, and
    // `UnexpectedClientError` alone cannot be told from a dropped connection.
    const unreadableStatus = responseReadStatus(error);
    if (unreadableStatus !== undefined && isAmbiguousStatus(unreadableStatus)) {
      throw new AutumnIndeterminateError(operation, unreadableStatus);
    }
    throw error;
  }
}

/**
 * The status a response to this operation carried, or `undefined` when no
 * response was ever received.
 *
 * Only the SDK's own response error and this package's own errors are read, so
 * no status is ever inferred from an error neither of them created. The caller's
 * `identify(ctx)` runs behind a pre-dispatch boundary that normalizes its other
 * failures before generated actions classify provider and transport errors.
 *
 * `AutumnError` is the SDK's base for the errors it raises from a response it
 * received. Its client errors sit outside that hierarchy and carry no status of
 * their own, so nothing the server actually decided is lost by ignoring them.
 */
export function sdkStatus(error: unknown): number | undefined {
  if (
    (error instanceof AutumnError ||
      error instanceof AutumnIndeterminateError) &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }
  // An unreadable body reaches the SDK as a client error with no status of its
  // own, and the status it observed is still in the wrapped cause.
  return responseReadStatus(error);
}

/**
 * Whether the SDK rejected the request against its own schema before sending it.
 *
 * The SDK parses every request locally and returns a `SDKValidationError`
 * without opening a connection, so the operation never reached Autumn and
 * blaming Autumn for it points an operator at the wrong system.
 *
 * `SDKValidationError` overrides `Symbol.hasInstance` to match anything carrying
 * `rawValue`, `rawMessage` and `pretty`, which a `ResponseValidationError`
 * does. That one describes a response the server already sent, so for a mutation
 * it means the operation may well have been applied. It is excluded here and
 * left to the ambiguity rules, which read the status it carries.
 */
export function isRequestRejectedLocally(error: unknown): boolean {
  return (
    error instanceof SDKValidationError &&
    !(error instanceof ResponseValidationError)
  );
}

/**
 * The SDK client errors that leave a request Autumn may already have received.
 *
 * These are classes rather than the names they carry, because a name
 * establishes nothing about which SDK failed. `ConnectionError`,
 * `UnexpectedClientError`, `RequestTimeoutError` and `RequestAbortedError` are
 * Speakeasy's standard generated names and Autumn's SDK is Speakeasy-generated,
 * so every other Speakeasy-generated SDK raises errors carrying exactly them,
 * and anything at all can set `name`. All four derive from the SDK's exported
 * `HTTPClientError`, which overrides no `Symbol.hasInstance`
 * (measured against autumn-js 1.2.55), so `instanceof` answers for the SDK that
 * raised the error.
 *
 * `InvalidRequestError`, the fifth `HTTPClientError`, is deliberately absent:
 * the SDK raises it while building a request, which it therefore never sent, so
 * nothing about that operation is open. Widening this to the shared base would
 * take it back in.
 */
function isSdkTransportFailure(error: unknown): boolean {
  return (
    error instanceof ConnectionError ||
    error instanceof UnexpectedClientError ||
    error instanceof RequestTimeoutError ||
    error instanceof RequestAbortedError
  );
}

export function isTransportIndeterminate(
  error: unknown,
  statusCode: number | undefined
): boolean {
  if (error instanceof AutumnIndeterminateError) return true;
  if (statusCode !== undefined && isAmbiguousStatus(statusCode)) return true;
  if (statusCode === undefined && isSdkTransportFailure(error)) return true;
  return false;
}
