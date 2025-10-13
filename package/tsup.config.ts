import alias from "esbuild-plugin-path-alias";
import * as path from "path";
import { defineConfig, type Options } from "tsup";

// Path aliases that match tsconfig.json
const pathAliases = {
	"@": path.resolve("./src/libraries/react"),
	"@sdk": path.resolve("./src/sdk"),
	"@styles": path.resolve("./src/styles"),
};

const reactConfigs: Options[] = [
	// Backend
	{
		entry: ["src/libraries/backend/**/*.{ts,tsx}"],
		format: ["cjs", "esm"],
		dts: true,
		clean: false, // Don't clean on subsequent builds
		outDir: "./dist/libraries/backend",
		external: [
			"react",
			"react/jsx-runtime",
			"react-dom",
			"better-auth",
			"better-call",
			"jotai",
		],
		bundle: true,
		skipNodeModulesBundle: true,
		esbuildOptions(options) {
			options.plugins = options.plugins || [];
			options.plugins.push(alias(pathAliases));
			options.define = {
				...options.define,
			};
		},
	},

	// React - Index file with CSS import (CommonJS)
	{
		entry: ["src/libraries/react/index.ts"],
		format: ["cjs", "esm"],
		dts: true,
		clean: false,
		outDir: "./dist/libraries/react",
		external: ["react", "react/jsx-runtime", "react-dom"],
		bundle: true,
		banner: {
			js: '"use client";',
		},
		injectStyle: true,
		esbuildOptions(options) {
			options.plugins = options.plugins || [];
			options.plugins.push(alias(pathAliases));
			options.define = {
				...options.define,
				__dirname: "import.meta.dirname",
				__filename: "import.meta.filename",
			};
		},
	},

	// React - Other files without CSS import
	{
		entry: [
			"src/libraries/react/**/*.{ts,tsx}",
			"!src/libraries/react/index.ts",
		],
		format: ["cjs", "esm"],
		dts: true,
		clean: false,
		outDir: "./dist/libraries/react",
		external: ["react", "react/jsx-runtime", "react-dom"],
		bundle: true,
		banner: {
			js: '"use client";\n',
		},
		esbuildOptions(options) {
			options.plugins = options.plugins || [];
			options.plugins.push(alias(pathAliases));
			options.define = {
				...options.define,
				__dirname: "import.meta.dirname",
				__filename: "import.meta.filename",
			};
		},
	},
];

export default defineConfig([
	{
		format: ["cjs", "esm"],
		entry: ["./src/sdk/index.ts"],
		skipNodeModulesBundle: true,
		dts: true,
		shims: true,
		clean: false,
		outDir: "./dist/sdk",

		treeshake: true,
		target: "es2020",

		esbuildOptions(options) {
			options.plugins = options.plugins || [];
			options.plugins.push(alias(pathAliases));
			options.define = {
				...options.define,
				__dirname: "import.meta.dirname",
				__filename: "import.meta.filename",
			};
		},
	},

	// GLOBAL
	{
		entry: ["src/utils/*.{ts,tsx}"],
		format: ["cjs", "esm"],
		dts: true,
		clean: true,
		bundle: true,
		outDir: "./dist/utils", // Fixed wildcard path to specific directory
		external: ["react", "react/jsx-runtime", "react-dom"],
		esbuildOptions(options) {
			options.plugins = options.plugins || [];
			options.plugins.push(alias(pathAliases));
			options.define = {
				...options.define,
				__dirname: "import.meta.dirname",
				__filename: "import.meta.filename",
			};
		},
	},

	// SDK
	{
		entry: ["src/next/*.{ts,tsx}"],
		format: ["cjs", "esm"],
		dts: true,
		clean: false, // Don't clean on subsequent builds
		outDir: "./dist/next",
		external: ["react", "react/jsx-runtime", "react-dom"],
		bundle: false,
		esbuildOptions(options) {
			options.plugins = options.plugins || [];
			options.plugins.push(alias(pathAliases));
			options.define = {
				...options.define,
				__dirname: "import.meta.dirname",
				__filename: "import.meta.filename",
			};
		},
	},
	...reactConfigs,

	// React client components
	{
		entry: ["src/next/client/**/*.ts", "src/next/client/**/*.tsx"],
		format: ["cjs", "esm"],
		dts: true,
		clean: true,
		outDir: "./dist/next/client",
		external: ["react", "react/jsx-runtime", "react-dom"],
		bundle: false,
		banner: {
			js: '"use client";\n',
		},
		esbuildOptions(options) {
			options.plugins = options.plugins || [];
			options.plugins.push(alias(pathAliases));
			options.platform = "browser";
			options.format = "esm";
		},
	},

	// Styles - Properly process CSS with PostCSS and Tailwind
	{
		entry: ["src/styles/global.css"],
		format: ["esm", "cjs"],
		outDir: "./dist/styles",
		clean: false,
		bundle: true,
	},

	// React server components
	{
		entry: ["src/next/server/**/*.{ts,tsx}"],
		format: ["cjs", "esm"],
		dts: true,
		clean: true,
		outDir: "./dist/next/server",
		external: [
			"react",
			"react/jsx-runtime",
			"react-dom",
			"@clerk/backend",
			"better-auth",
			"@supabase/ssr",
		],
		bundle: false,
		banner: {
			js: '"use server";',
		},
		esbuildOptions(options) {
			options.plugins = options.plugins || [];
			options.plugins.push(alias(pathAliases));
			options.banner = {
				js: '"use server";',
			};
			options.platform = "node";
			options.format = "esm";
		},
	},
]);
