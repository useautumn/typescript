import { defineConfig } from "tsup";

export default defineConfig([
  {
    format: ["cjs", "esm"],
    entry: ["./src/sdk/index.ts"],
    skipNodeModulesBundle: true,
    // dts: true,
    shims: true,
    clean: false,
    outDir: "./dist/sdk",

    treeshake: true,
    target: "es2020",

    dts: {
      entry: {
        general: "src/sdk/general/genTypes.ts",
        check: "src/sdk/general/checkTypes.ts",

        customers: "src/sdk/customers/cusTypes.ts",
        entities: "src/sdk/customers/entities/entTypes.ts",
        products: "src/sdk/products/prodTypes.ts",
        index: "src/sdk/index.ts", // Main types will go to index.d.ts
      },
      // This ensures .d.ts files are generated separately
      resolve: true,
    },
  },
  // {
  //   entry: ["./src/cli/index.ts"],
  //   format: ["cjs", "esm"],
  //   skipNodeModulesBundle: true,
  //   clean: false,
  //   outDir: "./dist/cli",
  //   dts: true,
  // },

  // GLOBAL
  {
    entry: ["src/utils/*.{ts,tsx}"],
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
    bundle: true,
    outDir: "./dist/utils", // Fixed wildcard path to specific directory
    external: ["react", "react/jsx-runtime", "react-dom"],
  },

  // SDK
  {
    entry: ["src/next/*.{ts,tsx}"],
    format: ["cjs", "esm"],
    dts: {
      entry: "src/next/index.ts",
    },
    clean: false, // Don't clean on subsequent builds
    outDir: "./dist/next",
    external: ["react", "react/jsx-runtime", "react-dom"],
    bundle: false,
  },

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
      // options.banner = {
      //   js: '"use client";',
      // };
      options.platform = "browser";
      options.format = "esm";
    },
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
      // /^@clerk.*/,
    ],
    bundle: false,
    banner: {
      js: '"use server";',
    },
    esbuildOptions(options) {
      options.banner = {
        js: '"use server";',
      };
      options.platform = "node";
      options.format = "esm";
    },
  },
]);
