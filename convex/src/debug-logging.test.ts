/// <reference types="vite/client" />

import { afterEach, expect, test, vi } from "vitest";
import { AutumnTransport, invokeNative } from "./transport.js";

const SECRET_KEY = "sk_SUPER_SECRET_VALUE";
const PROVIDER_ONLY_FIELD = "provider-only-value";

/** Everything the SDK's request and response loggers call. */
const CONSOLE_METHODS = ["group", "groupEnd", "log"] as const;

function readable(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.AUTUMN_DEBUG;
});

/**
 * The SDK logs the whole exchange to `console` as soon as `AUTUMN_DEBUG` is set
 * and no logger was supplied: the request logger prints every header, the
 * `Authorization` bearer token among them, and both loggers print bodies. In
 * Convex that console is the deployment log, so the package supplies a logger of
 * its own and the fallback never engages.
 *
 * The SDK reads the environment once per process and memoizes it, so this file
 * holds only this test and sets the variable before the first client exists.
 */
test("keeps the secret key and provider bodies out of the console under AUTUMN_DEBUG", async () => {
  process.env.AUTUMN_DEBUG = "true";

  const captured: string[] = [];
  for (const method of CONSOLE_METHODS) {
    vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      for (const arg of args) captured.push(readable(arg));
    });
  }

  const fetcher = vi.fn(
    async () =>
      new Response(JSON.stringify({ secret_field: PROVIDER_ONLY_FIELD }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
  );
  const transport = new AutumnTransport({
    secretKey: SECRET_KEY,
    serverURL: "https://example.test",
    fetcher,
  });

  const request = { customerId: "customer-1", featureId: "messages" };
  await invokeNative("track", transport.createCall(), request, (sdk, options) =>
    sdk.track(request, options)
  );

  // The call really happened, so an empty console is suppression rather than an
  // exchange that never took place.
  expect(fetcher).toHaveBeenCalledOnce();
  const output = captured.join("\n");
  expect(output).not.toContain(SECRET_KEY);
  expect(output).not.toContain(PROVIDER_ONLY_FIELD);
  expect(output).not.toContain("authorization");
  expect(output).not.toContain("Authorization");
  expect(captured).toEqual([]);
});
