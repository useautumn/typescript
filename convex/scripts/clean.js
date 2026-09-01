import { readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Remove the build output and its incremental state.
 *
 * `tsc` never deletes anything, so output for a source file that no longer
 * exists survives in `dist` and reaches the next tarball. This runs before every
 * build for that reason. It is Node rather than `rm -rf dist *.tsbuildinfo`
 * because that command needs a POSIX shell for both the flag and the glob, and
 * the package is developed on Windows too.
 */
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

rmSync(join(packageRoot, "dist"), { recursive: true, force: true });
for (const entry of readdirSync(packageRoot)) {
  if (entry.endsWith(".tsbuildinfo")) {
    rmSync(join(packageRoot, entry), { force: true });
  }
}
