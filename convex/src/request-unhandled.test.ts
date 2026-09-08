"use node";
// @vitest-environment node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

/**
 * The unguarded SDK control has to run outside Vitest's worker. Node observes the
 * SDK's second rejected promise after the caller has already caught the first.
 */
test("the installed SDK control reproduces its second rejection path", () => {
  const fixture = fileURLToPath(
    new URL("./request-unhandled.fixture.mjs", import.meta.url)
  );
  const result = spawnSync(process.execPath, [fixture], {
    encoding: "utf8",
    timeout: 10_000,
  });

  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout)).toEqual({
    callerRejected: true,
    callerName: "TypeError",
    unhandledCount: 1,
    unhandledName: "TypeError",
  });
});
