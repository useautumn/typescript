import React, {useEffect, useState} from 'react';
import {Text} from 'ink';
import {
	getProducts,
	getFeatures,
	buildProductBuilderString,
} from '../core/pull.js';
import {writeConfig} from '../core/config.js';

export function Pull({config}: {config: any}) {
	const [message, setMessage] = useState('Pulling products...');

	useEffect(() => {
		(async () => {
			const products = await getProducts(config.products.map((p: any) => p.id));
			const features = await getFeatures();

			const productStrings = products.map(buildProductBuilderString);
			setMessage('Writing Config...');
			writeConfig(productStrings, []);
			setMessage('Config written successfully!');
		})();
	}, []);

	return <Text>{message}</Text>;
}
