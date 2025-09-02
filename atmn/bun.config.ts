async function getVersion(): Promise<string> {
	const packageJson = await Bun.file("./package.json").json();
	return packageJson.version;
}

async function build() {
	console.log(`Building atmn v${await getVersion()}`);
	await Bun.build({
		entrypoints: ["./source/cli.ts", "./source/index.ts"],
		outdir: "./dist",
		format: "esm",
		target: "node",
		define: {
			VERSION: `"${await getVersion()}"`,
		}
	});

	// Generate TypeScript declaration files
	await Bun.spawn(["tsc", "--emitDeclarationOnly"], {
		stdio: ["inherit", "inherit", "inherit"],
	});
}

build();