async function build() {
	await Bun.build({
		entrypoints: ["./source/cli.ts", "./source/index.ts"],
		outdir: "./dist",
		format: "esm",
		target: "node",
	});

	// Generate TypeScript declaration files
	await Bun.spawn(["tsc", "--emitDeclarationOnly"], {
		stdio: ["inherit", "inherit", "inherit"],
	});
}

build();