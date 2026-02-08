import fs from "fs";
import path from "path";

/**
 * Check if `atmn` is listed in the project's package.json
 * (dependencies or devDependencies). This ensures autumn.config.ts
 * can import from "atmn" without type errors.
 */
export function checkAtmnInstalled(): boolean {
	try {
		const packageJsonPath = path.join(process.cwd(), "package.json");
		if (!fs.existsSync(packageJsonPath)) {
			return false;
		}

		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
		return !!(
			packageJson.dependencies?.atmn || packageJson.devDependencies?.atmn
		);
	} catch {
		return false;
	}
}
