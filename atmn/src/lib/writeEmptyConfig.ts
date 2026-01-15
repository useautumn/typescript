import fs from "node:fs";
import path from "node:path";

/**
 * Writes an empty/skeleton autumn.config.ts file to the current working directory
 */
export function writeEmptyConfig(): void {
	const content = `import { plan, feature, planFeature } from 'atmn'
// export const message = feature({ "id": "msg", "name": "Messages", "type": "metered", "consumable": true })
// export const free = plan({ "id": "free", "name": "Free Tier", features: [...] })
`;

	const configPath = path.join(process.cwd(), "autumn.config.ts");
	fs.writeFileSync(configPath, content, "utf-8");
}
