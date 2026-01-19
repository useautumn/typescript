/**
 * Global CLI context for storing parsed options
 * This avoids relying on process.argv parsing which doesn't handle combined flags like -lp
 */

export interface CliContext {
	prod: boolean;
	local: boolean;
}

let context: CliContext = {
	prod: false,
	local: false,
};

/**
 * Set the CLI context from parsed commander options
 * Should be called once at CLI startup before any commands run
 */
export function setCliContext(options: Partial<CliContext>): void {
	context = {
		prod: options.prod ?? false,
		local: options.local ?? false,
	};
}

/**
 * Get the current CLI context
 */
export function getCliContext(): CliContext {
	return context;
}

/**
 * Check if production mode is enabled
 */
export function isProd(): boolean {
	return context.prod;
}

/**
 * Check if local mode is enabled
 */
export function isLocal(): boolean {
	return context.local;
}
