import React from 'react';
import fs from 'fs';
import path from 'path';
import {Text} from 'ink';

export default function Init() {
	const configPath = path.join(process.cwd(), 'autumn.config.ts');

	if (fs.existsSync(configPath)) {
		return <Text color="yellow">autumn.config.ts already exists!</Text>;
	}

	const configContent = `
import { product } from 'autumn-js/compose';

const freeProduct = product({
	id: 'free',
	name: 'Free',
})
`;

	try {
		fs.writeFileSync(configPath, configContent);
		return <Text color="green">Created autumn.config.ts successfully!</Text>;
	} catch (error) {
		return (
			<Text color="red">
				Error creating autumn.config.ts: {(error as any).message}
			</Text>
		);
	}
}
