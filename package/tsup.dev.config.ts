import { defineConfig, Options } from "tsup";
import path from "path";
import alias from "esbuild-plugin-alias";

// Path aliases that match tsconfig.json
const pathAliases = {
  '@': path.resolve('./src/libraries/react'),
  '@sdk': path.resolve('./src/sdk'),
};

const reactConfigs: Options[] = [
  // Backend
  {
    entry: ["src/libraries/backend/**/*.{ts,tsx}"],
    format: ["cjs", "esm"],
    dts: false, // Disabled for dev
    clean: false, // Don't clean on subsequent builds
    outDir: "./dist/libraries/backend",
    external: ["react", "react/jsx-runtime", "react-dom"],
    bundle: true,
    esbuildOptions(options) {
      options.plugins = options.plugins || [];
      options.plugins.push(alias(pathAliases));
    },
  },

  // React
  {
    entry: ["src/libraries/react/**/*.{ts,tsx}"],
    format: ["cjs", "esm"],
    dts: false, // Disabled for dev
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
    },
  },
];

export default defineConfig([
  {
    format: ["cjs", "esm"],
    entry: ["./src/sdk/index.ts"],
    skipNodeModulesBundle: true,
    dts: false, // Disabled for dev
    shims: true,
    clean: false,
    outDir: "./dist/sdk",

    treeshake: true,
    target: "es2020",

    esbuildOptions(options) {
      options.plugins = options.plugins || [];
      options.plugins.push(alias(pathAliases));
    },
  },

  // GLOBAL
  {
    entry: ["src/utils/*.{ts,tsx}"],
    format: ["cjs", "esm"],
    dts: false, // Disabled for dev
    clean: true,
    bundle: true,
    outDir: "./dist/utils", // Fixed wildcard path to specific directory
    external: ["react", "react/jsx-runtime", "react-dom"],
    esbuildOptions(options) {
      options.plugins = options.plugins || [];
      options.plugins.push(alias(pathAliases));
    },
  },

  // SDK
  {
    entry: ["src/next/*.{ts,tsx}"],
    format: ["cjs", "esm"],
    dts: false, // Disabled for dev
    clean: false, // Don't clean on subsequent builds
    outDir: "./dist/next",
    external: ["react", "react/jsx-runtime", "react-dom"],
    bundle: false,
    esbuildOptions(options) {
      options.plugins = options.plugins || [];
      options.plugins.push(alias(pathAliases));
    },
  },
  ...reactConfigs,

  // React client components
  {
    entry: ["src/next/client/**/*.ts", "src/next/client/**/*.tsx"],
    format: ["cjs", "esm"],
    dts: false, // Disabled for dev
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

  // Styles - Convert CSS to JS module for auto-injection
  {
    entry: ["src/styles/index.css"],
    format: ["esm", "cjs"],
    outDir: "./dist/styles",
    clean: false,
    bundle: true,
    esbuildOptions(options) {
      options.plugins = options.plugins || [];
      options.plugins.push({
        name: 'css-to-js',
        setup(build) {
          build.onLoad({ filter: /\.css$/ }, async (args) => {
            const postcss = await import('postcss');
            const fs = await import('fs/promises');
            const path = await import('path');
            
            // Load PostCSS config
            const configPath = path.resolve(process.cwd(), 'postcss.config.mjs');
            const config = await import(configPath);
            
            const css = await fs.readFile(args.path, 'utf8');
            const result = await postcss.default(config.default.plugins).process(css, {
              from: args.path,
              to: undefined,
            });
            
            // Convert CSS to JavaScript module that auto-injects styles
            const jsContent = `
let injected = false;

export function injectStyles() {
  if (injected || typeof document === 'undefined') return;
  
  const style = document.createElement('style');
  style.textContent = ${JSON.stringify(result.css)};
  style.setAttribute('data-autumn-styles', 'true');
  document.head.appendChild(style);
  injected = true;
}

// Auto-inject on import
if (typeof document !== 'undefined') {
  injectStyles();
}

export default ${JSON.stringify(result.css)};
`;
            
            return {
              contents: jsContent,
              loader: 'js',
            };
          });
        },
      });
    },
  },

  // React server components
  {
    entry: ["src/next/server/**/*.{ts,tsx}"],
    format: ["cjs", "esm"],
    dts: false, // Disabled for dev
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