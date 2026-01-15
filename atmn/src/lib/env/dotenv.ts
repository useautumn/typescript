import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Low-level .env file reading/writing utilities
 */

export interface DotenvEntry {
	key: string;
	value: string;
}

/**
 * Parse .env file content into key-value pairs
 */
export function parseDotenv(content: string): Map<string, string> {
	const entries = new Map<string, string>();

	for (const line of content.split("\n")) {
		const trimmed = line.trim();

		// Skip comments and empty lines
		if (!trimmed || trimmed.startsWith("#")) {
			continue;
		}

		// Parse KEY=VALUE
		const match = trimmed.match(/^([^=]+)=(.*)$/);
		if (match) {
			const [, key, value] = match;
			if (key && value !== undefined) {
				// Remove quotes if present
				const cleanValue = value.replace(/^["']|["']$/g, "");
				entries.set(key.trim(), cleanValue);
			}
		}
	}

	return entries;
}

/**
 * Read a .env file and return parsed entries
 */
export function readDotenvFile(filePath: string): Map<string, string> {
	if (!existsSync(filePath)) {
		return new Map();
	}

	try {
		const content = readFileSync(filePath, "utf-8");
		return parseDotenv(content);
	} catch (_error) {
		return new Map();
	}
}

/**
 * Write entries to a .env file
 */
export function writeDotenvFile(
	filePath: string,
	entries: Map<string, string>,
): void {
	const lines = Array.from(entries.entries())
		.map(([key, value]) => {
			// Quote values that contain spaces
			const quotedValue = value.includes(" ") ? `"${value}"` : value;
			return `${key}=${quotedValue}`;
		})
		.join("\n");

	writeFileSync(filePath, lines + "\n", "utf-8");
}

/**
 * Get value from .env file (checks .env.local first, then .env)
 */
export function getDotenvValue(key: string, cwd = process.cwd()): string | undefined {
	const localPath = resolve(cwd, ".env.local");
	const localEntries = readDotenvFile(localPath);
	if (localEntries.has(key)) {
		return localEntries.get(key);
	}

	const envPath = resolve(cwd, ".env");
	const envEntries = readDotenvFile(envPath);
	return envEntries.get(key);
}

/**
 * Set value in .env file (always writes to .env, not .env.local)
 */
export function setDotenvValue(
	key: string,
	value: string,
	cwd = process.cwd(),
): void {
	const envPath = resolve(cwd, ".env");
	const entries = readDotenvFile(envPath);
	entries.set(key, value);
	writeDotenvFile(envPath, entries);
}
