// @vitest-environment node
import { execFileSync } from "node:child_process";
import { gunzipSync } from "node:zlib";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageManager = process.env.npm_execpath;
const manifest = JSON.parse(
  readFileSync(join(packageRoot, "package.json"), "utf8")
) as { name: string; version: string };
const tarball = `${manifest.name.replace("@", "").replace("/", "-")}-${manifest.version}.tgz`;
const staleOutput = [
  "dist/legacy-helper.js",
  "dist/legacy-helper.d.ts",
  "dist/client/legacy-helper.js",
];

function run(...args: string[]): void {
  const [command, commandArgs] = packageManager
    ? [process.execPath, [packageManager, ...args]]
    : ["pnpm", args];
  execFileSync(command, commandArgs, { cwd: packageRoot, stdio: "pipe" });
}

/**
 * Read the file names out of an npm tarball without shelling out to `tar`.
 * Each entry is a 512-byte header holding the name and an octal size, followed
 * by its content padded to the next 512-byte boundary.
 */
function tarballEntries(archive: string): string[] {
  const buffer = gunzipSync(readFileSync(archive));
  const field = (offset: number, start: number, length: number) =>
    buffer
      .toString("utf8", offset + start, offset + start + length)
      .split("\0")[0]!;
  const entries: string[] = [];
  for (let offset = 0; offset + 512 <= buffer.length; ) {
    const name = field(offset, 0, 100);
    if (name === "") break;
    entries.push(name);
    const size = parseInt(field(offset, 124, 12).trim(), 8);
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return entries;
}

describe("release packaging", () => {
  let destination: string;
  let entries: string[];

  beforeAll(() => {
    destination = mkdtempSync(join(tmpdir(), "autumn-convex-pack-"));
    for (const relativePath of staleOutput) {
      const absolutePath = join(packageRoot, relativePath);
      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, "export const removedHelper = true;\n");
    }

    run("run", "build");
    run("pack", "--pack-destination", destination);
    entries = tarballEntries(join(destination, tarball));
  }, 300_000);

  afterAll(() => {
    rmSync(destination, { recursive: true, force: true });
    // A failed build leaves the seeded files behind for the next `pnpm pack`.
    for (const relativePath of staleOutput) {
      rmSync(join(packageRoot, relativePath), { force: true });
    }
  });

  test("emits the declared entry points", () => {
    expect(entries).toContain("package/dist/client/index.js");
    expect(entries).toContain("package/dist/client/index.d.ts");
    expect(entries).toContain("package/dist/component/convex.config.js");
    expect(entries).toContain("package/scripts/clean.js");
  });

  test("removes output for source files that no longer exist", () => {
    expect(entries.filter((entry) => entry.includes("legacy-helper"))).toEqual(
      []
    );
    for (const relativePath of staleOutput) {
      expect(() => readFileSync(join(packageRoot, relativePath))).toThrow();
    }
  });
});
