import type { Feature, Plan } from "../../../source/compose/models/index.js";
import type { AppEnv } from "../../lib/env/index.js";

/**
 * Options for pull command
 */
export interface PullOptions {
	/** Whether to generate SDK types (.d.ts) */
	generateSdkTypes?: boolean;
	/** Working directory (defaults to process.cwd()) */
	cwd?: string;
	/** Environment to pull from (defaults to AppEnv.Sandbox) */
	environment?: AppEnv;
}

/**
 * Result of pull operation
 */
export interface PullResult {
	/** Features pulled from sandbox */
	features: Feature[];
	/** Plans pulled from sandbox */
	plans: Plan[];
	/** Path to generated config file */
	configPath: string;
	/** Path to generated SDK types file (if generateSdkTypes was true) */
	sdkTypesPath?: string;
}

/**
 * Data fetched and transformed from an environment
 */
export interface EnvironmentData {
	features: Feature[];
	plans: Plan[];
}
