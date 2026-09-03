import { Autumn as AutumnSDK, HTTPClient } from "autumn-js";
import {
  AutumnConfigurationError,
  AutumnIndeterminateError,
} from "./errors.js";

const API_VERSION = "2.3.0";
const PROTECTED_HEADERS = new Set([
  "authorization",
  "content-type",
  "x-api-version",
  "idempotency-key",
]);

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

class AutumnMalformedResponseError extends Error {}

async function requireJsonSuccess(response: Response): Promise<void> {
  if (response.status < 200 || response.status >= 300) return;
  try {
    await response.clone().json();
  } catch {
    throw new AutumnMalformedResponseError();
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
        await requireJsonSuccess(response);
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
  invoke: (sdk: AutumnSDK, options: AutumnCall["requestOptions"]) => Promise<T>
): Promise<T> {
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
    throw error;
  }
}

export function sdkStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }
  return undefined;
}

export function isTransportIndeterminate(
  error: unknown,
  statusCode: number | undefined
): boolean {
  if (error instanceof AutumnIndeterminateError) return true;
  if (
    statusCode === 202 ||
    statusCode === 409 ||
    (statusCode !== undefined && statusCode >= 500) ||
    (statusCode !== undefined && statusCode >= 200 && statusCode < 300)
  ) {
    return true;
  }
  if (
    statusCode === undefined &&
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error.name === "ConnectionError" ||
      error.name === "UnexpectedClientError" ||
      error.name === "RequestTimeoutError" ||
      error.name === "RequestAbortedError")
  ) {
    return true;
  }
  return false;
}
