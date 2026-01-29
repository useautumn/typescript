import { defineConfig } from 'tsup';
import packageJson from './package.json';

export default defineConfig([
	{
		format: ['cjs', 'esm'],
		entry: ['./source/cli.ts', './source/index.ts'],
		skipNodeModulesBundle: true,
		dts: true,
		shims: true,
		clean: false,
		outDir: './dist',
		treeshake: true,
		target: 'es2020',
		define: {
			VERSION: JSON.stringify(packageJson.version),
		}
	},
]);
