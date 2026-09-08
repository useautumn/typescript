/* global process */

import { setImmediate } from "node:timers";
import { Autumn, HTTPClient } from "autumn-js";

/** @type {unknown[]} */
const rejections = [];
process.on("unhandledRejection", (reason) => rejections.push(reason));

let fetchCount = 0;
const sdk = new Autumn({
  secretKey: "test-secret-key",
  serverURL: "https://example.test",
  failOpen: false,
  retryConfig: { strategy: "none" },
  debugLogger: { group() {}, groupEnd() {}, log() {} },
  httpClient: new HTTPClient({
    fetcher: async () => {
      fetchCount += 1;
      throw new Error("fetch must not run");
    },
  }),
});

let prototypeReads = 0;
const properties =
  process.argv[2] === "typed-array-proxy"
    ? {
        bytes: new Proxy(new Uint8Array([1, 2, 3]), {
          getPrototypeOf() {
            prototypeReads += 1;
            return prototypeReads === 1
              ? Uint8Array.prototype
              : Object.prototype;
          },
        }),
      }
    : { amount: 1n };
const callerError = await sdk
  .track(
    {
      customerId: "customer-1",
      featureId: "messages",
      properties,
    },
    { retries: { strategy: "none" } }
  )
  .catch((error) => error);

await new Promise(setImmediate);
const result = {
  callerRejected: callerError instanceof Error,
  callerName: callerError?.name,
  unhandledCount: rejections.length,
  unhandledName:
    rejections[0] instanceof Error ? rejections[0].name : typeof rejections[0],
  ...(process.argv[2] === "typed-array-proxy"
    ? { fetchCount, prototypeReads }
    : {}),
};
process.stdout.write(JSON.stringify(result));
process.exitCode =
  result.callerRejected && result.unhandledCount === 1 && fetchCount === 0
    ? 0
    : 1;
