"use node";
// @vitest-environment node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EdgeVM } from "@edge-runtime/vm";
import { Autumn as AutumnSDK, HTTPClient } from "autumn-js";
import { describe, expect, test, vi } from "vitest";
import { Autumn, AutumnValidationError } from "./client/index.js";

const CUSTOMER_ID = "customer-1";
const SILENT_LOGGER = {
  group: () => {},
  groupEnd: () => {},
  log: () => {},
};

function rejected(): Response {
  return new Response(JSON.stringify({ message: "rejected" }), {
    status: 400,
    headers: { "content-type": "application/json" },
  });
}

function packageVersion(entry: string, name: string): string {
  let directory = dirname(entry);
  for (;;) {
    const packagePath = join(directory, "package.json");
    if (existsSync(packagePath)) {
      const manifest = JSON.parse(readFileSync(packagePath, "utf8")) as {
        name?: string;
        version?: string;
      };
      if (manifest.name === name && manifest.version) return manifest.version;
    }
    const parent = dirname(directory);
    if (parent === directory)
      throw new Error(`Cannot resolve ${name} version.`);
    directory = parent;
  }
}

function client(fetcher: typeof fetch) {
  return new Autumn({} as never, {
    secretKey: "test-secret-key",
    serverURL: "https://example.test",
    operationNamespace: "request-sdk",
    identify: async () => ({ customerId: CUSTOMER_ID }),
    fetcher,
  });
}

function changingPrototypeBytes() {
  let prototypeReads = 0;
  const bytes = new Proxy(new Uint8Array([1, 2, 3]), {
    getPrototypeOf() {
      prototypeReads += 1;
      return prototypeReads === 1 ? Uint8Array.prototype : Object.prototype;
    },
  });
  return { bytes, prototypeReads: () => prototypeReads };
}

function sdkChangingPrototypeBytes() {
  const fixture = fileURLToPath(
    new URL("./request-unhandled.fixture.mjs", import.meta.url)
  );
  const result = spawnSync(process.execPath, [fixture, "typed-array-proxy"], {
    encoding: "utf8",
    timeout: 10_000,
  });
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout) as {
    callerRejected: boolean;
    callerName: string;
    fetchCount: number;
    prototypeReads: number;
    unhandledCount: number;
    unhandledName: string;
  };
}

async function packageTrack(properties: Record<string, unknown>) {
  const requests: Request[] = [];
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    requests.push(new Request(input));
    return rejected();
  });
  const caught = await client(fetcher)
    .track(null, {
      featureId: "messages",
      properties,
      operationId: "package-track",
    })
    .catch((error: unknown) => error);
  return { caught, fetcher, requests };
}

async function sdkTrack(properties: Record<string, unknown>) {
  const requests: Request[] = [];
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    requests.push(new Request(input));
    return rejected();
  });
  const sdk = new AutumnSDK({
    secretKey: "test-secret-key",
    serverURL: "https://example.test",
    failOpen: false,
    retryConfig: { strategy: "none" },
    debugLogger: SILENT_LOGGER,
    httpClient: new HTTPClient({ fetcher }),
  });
  const caught = await sdk
    .track(
      { customerId: CUSTOMER_ID, featureId: "messages", properties },
      { retries: { strategy: "none" } }
    )
    .catch((error: unknown) => error);
  return { caught, fetcher, requests };
}

async function packageUpdate(featureQuantities: unknown[]) {
  const fetcher = vi.fn(async () => rejected());
  const caught = await client(fetcher)
    .billing.update(null, {
      planId: "pro",
      featureQuantities,
      operationId: "package-update",
    } as never)
    .catch((error: unknown) => error);
  return { caught, fetcher };
}

async function sdkUpdate(featureQuantities: unknown[]) {
  const fetcher = vi.fn(async () => rejected());
  const sdk = new AutumnSDK({
    secretKey: "test-secret-key",
    serverURL: "https://example.test",
    failOpen: false,
    retryConfig: { strategy: "none" },
    debugLogger: SILENT_LOGGER,
    httpClient: new HTTPClient({ fetcher }),
  });
  const caught = await sdk.billing
    .update(
      {
        customerId: CUSTOMER_ID,
        planId: "pro",
        featureQuantities,
      } as never,
      { retries: { strategy: "none" } }
    )
    .catch((error: unknown) => error);
  return { caught, fetcher };
}

describe("installed SDK request contracts", () => {
  test("resolves the installed request contract dependencies", () => {
    const rootRequire = createRequire(import.meta.url);
    const sdkEntry = rootRequire.resolve("autumn-js");
    const sdkRequire = createRequire(sdkEntry);
    const zodEntry = sdkRequire.resolve("zod");
    const edgeRuntimeEntry = rootRequire.resolve("@edge-runtime/vm");

    expect(packageVersion(sdkEntry, "autumn-js")).toBe("1.2.55");
    expect(packageVersion(zodEntry, "zod")).toBe("4.1.5");
    expect(packageVersion(edgeRuntimeEntry, "@edge-runtime/vm")).toBe("5.0.0");
  });

  test("matches the SDK rejection for a noncanonical array length", async () => {
    const featureQuantities = new Proxy(
      [
        { featureId: "seats", quantity: 1 },
        { featureId: "messages", quantity: 2 },
      ],
      {
        get(target, key, receiver) {
          if (key === "length") return 1.5;
          return Reflect.get(target, key, receiver);
        },
      }
    );

    const native = await sdkUpdate(featureQuantities);
    const packaged = await packageUpdate(featureQuantities);

    expect(native.caught).toMatchObject({ name: "SDKValidationError" });
    expect(packaged.caught).toBeInstanceOf(AutumnValidationError);
    expect(native.fetcher).not.toHaveBeenCalled();
    expect(packaged.fetcher).not.toHaveBeenCalled();
  });

  test("matches the SDK rejection for a changing byte prototype", async () => {
    const native = sdkChangingPrototypeBytes();
    const changing = changingPrototypeBytes();
    const packaged = await packageTrack({ bytes: changing.bytes });

    expect(native).toEqual({
      callerRejected: true,
      callerName: "TypeError",
      fetchCount: 0,
      prototypeReads: 1,
      unhandledCount: 1,
      unhandledName: "TypeError",
    });
    expect(packaged.caught).toBeInstanceOf(AutumnValidationError);
    expect(packaged.fetcher).not.toHaveBeenCalled();
    expect(changing.prototypeReads()).toBe(1);
  });

  test("matches the SDK body for Edge Runtime encoded bytes", async () => {
    const edge = new EdgeVM();
    const bytes = edge.evaluate<Uint8Array>(
      'new TextEncoder().encode("value")'
    );
    Object.defineProperty(edge.context, "bytes", { value: bytes });
    expect(edge.evaluate("bytes instanceof Uint8Array")).toBe(true);
    expect(
      edge.evaluate("Object.getPrototypeOf(bytes) === Uint8Array.prototype")
    ).toBe(false);

    const native = await sdkTrack({ bytes });
    const packaged = await packageTrack({ bytes });

    expect(native.fetcher).toHaveBeenCalledOnce();
    expect(packaged.fetcher).toHaveBeenCalledOnce();
    const nativeBody = await native.requests[0]!.text();
    const packagedBody = await packaged.requests[0]!.text();
    expect(packagedBody).toBe(nativeBody);
    expect(JSON.parse(packagedBody)).toMatchObject({
      properties: { bytes: "dmFsdWU=" },
    });
  });

  test("rejects a symbol key on a free SDK record without fetching", async () => {
    const properties: Record<string, unknown> = { kept: true };
    Object.defineProperty(properties, Symbol("private"), { value: "hidden" });

    const { caught, fetcher } = await packageTrack(properties);

    expect(caught).toBeInstanceOf(AutumnValidationError);
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("includes a non-enumerable string key from a free SDK record", async () => {
    const properties: Record<string, unknown> = { kept: true };
    Object.defineProperty(properties, "hidden", { value: "included" });

    const { requests } = await packageTrack(properties);

    expect(requests).toHaveLength(1);
    expect(await requests[0]!.json()).toMatchObject({
      properties: { kept: true, hidden: "included" },
    });
  });

  test("rejects a non-enumerable field outside registered records", async () => {
    const fetcher = vi.fn();
    const args = {} as { planId: string };
    Object.defineProperty(args, "planId", { value: "pro" });

    await expect(client(fetcher).plans.get(null, args)).rejects.toBeInstanceOf(
      AutumnValidationError
    );
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("skips __proto__ on an SDK record without evaluating it", async () => {
    const getter = vi.fn(() => "must-not-run");
    const properties: Record<string, unknown> = { kept: true };
    Object.defineProperty(properties, "__proto__", {
      enumerable: true,
      get: getter,
    });

    const { requests } = await packageTrack(properties);

    expect(getter).not.toHaveBeenCalled();
    expect(requests).toHaveLength(1);
    const body = await requests[0]!.text();
    expect(body).not.toContain("__proto__");
  });

  test("preserves nested __proto__ data below a free value", async () => {
    const nested = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(nested, "__proto__", {
      enumerable: true,
      value: { safe: true },
    });

    const { requests } = await packageTrack({ nested });

    expect(requests).toHaveLength(1);
    const body = (await requests[0]!.json()) as {
      properties: { nested: Record<string, unknown> };
    };
    expect(
      Object.prototype.hasOwnProperty.call(body.properties.nested, "__proto__")
    ).toBe(true);
    expect(body.properties.nested.__proto__).toEqual({ safe: true });
  });

  test.each(["constructor", "prototype"])(
    "matches the SDK decision and body for the %s key",
    async (key) => {
      const properties = { [key]: "value", kept: true };

      const native = await sdkTrack(properties);
      const packaged = await packageTrack(properties);

      expect(packaged.fetcher.mock.calls.length).toBe(
        native.fetcher.mock.calls.length
      );
      expect(
        packaged.caught instanceof Error
          ? packaged.caught.constructor.name
          : typeof packaged.caught
      ).toBe(
        native.caught instanceof Error
          ? native.caught.constructor.name
          : typeof native.caught
      );
      if (native.requests.length === 1) {
        expect(await packaged.requests[0]!.text()).toBe(
          await native.requests[0]!.text()
        );
      }
    }
  );

  test("omits undefined from a free record", async () => {
    const { requests } = await packageTrack({ kept: true, omitted: undefined });

    expect(requests).toHaveLength(1);
    expect(await requests[0]!.json()).toMatchObject({
      properties: { kept: true },
    });
  });

  test("rejects undefined in a string record without fetching", async () => {
    const fetcher = vi.fn();
    const metadata = { kept: "yes", omitted: undefined } as unknown as Record<
      string,
      string
    >;

    await expect(
      client(fetcher).billing.attach(null, {
        planId: "pro",
        metadata,
        operationId: "string-record-undefined",
      })
    ).rejects.toBeInstanceOf(AutumnValidationError);
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("keeps customer metadata free and billing metadata string-only", async () => {
    const requests: Request[] = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      requests.push(new Request(input));
      return rejected();
    });
    const autumn = client(fetcher);

    await autumn.customers
      .update(null, {
        metadata: {
          nested: { at: new Date("2026-01-01T00:00:00.000Z") },
          omitted: undefined,
        },
        operationId: "customer-metadata",
      })
      .catch(() => undefined);
    await autumn.billing
      .attach(null, {
        planId: "pro",
        metadata: { source: "billing" },
        operationId: "billing-metadata",
      })
      .catch(() => undefined);

    expect(requests).toHaveLength(2);
    expect(await requests[0]!.json()).toMatchObject({
      metadata: { nested: { at: "2026-01-01T00:00:00.000Z" } },
    });
    expect(await requests[1]!.json()).toMatchObject({
      metadata: { source: "billing" },
    });
  });

  test("leaves SDK defaults, integer checks and field renaming intact", async () => {
    const requests: Request[] = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      requests.push(new Request(input));
      return rejected();
    });
    const autumn = client(fetcher);

    await autumn.billing
      .previewAttach(null, {
        planId: "pro",
        featureQuantities: [{ featureId: "seats", quantity: 2 }],
      })
      .catch(() => undefined);
    await expect(
      autumn.track(null, {
        featureId: "messages",
        timestamp: 1.5,
        operationId: "fractional-timestamp",
      })
    ).rejects.toBeDefined();

    expect(requests).toHaveLength(1);
    expect(await requests[0]!.json()).toMatchObject({
      plan_id: "pro",
      redirect_mode: "if_required",
      feature_quantities: [{ feature_id: "seats", quantity: 2 }],
    });
  });
});
