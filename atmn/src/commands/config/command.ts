import Conf from "conf";

const VALID_KEYS = ["noDeclarationFile"] as const;
type ConfigKey = (typeof VALID_KEYS)[number];

const BOOLEAN_KEYS: ConfigKey[] = ["noDeclarationFile"];

function getStore() {
	return new Conf({ projectName: "atmn" });
}

/** Read a single key from global config */
export function getGlobalConfig(): Conf {
	return getStore();
}

/**
 * atmn config command — git-config style, always headless.
 * `atmn config --global <key> [value]`
 */
export function configCommand(args: string[], flags: { global?: boolean }) {
	if (!flags.global) {
		console.log("Usage: atmn config --global <key> [value]");
		console.log("");
		console.log("Supported keys:");
		for (const key of VALID_KEYS) {
			console.log(`  ${key}`);
		}
		return;
	}

	const [key, value] = args;

	if (!key) {
		console.log("Usage: atmn config --global <key> [value]");
		return;
	}

	if (!VALID_KEYS.includes(key as ConfigKey)) {
		console.error(`error: unknown key '${key}'`);
		console.error(`Valid keys: ${VALID_KEYS.join(", ")}`);
		process.exit(1);
	}

	const store = getStore();

	// Read
	if (value === undefined) {
		const val = store.get(key);
		if (val !== undefined) {
			console.log(String(val));
		}
		return;
	}

	// Write
	if (BOOLEAN_KEYS.includes(key as ConfigKey)) {
		if (value !== "true" && value !== "false") {
			console.error(`error: '${key}' expects 'true' or 'false', got '${value}'`);
			process.exit(1);
		}
		store.set(key, value === "true");
	} else {
		store.set(key, value);
	}
}
