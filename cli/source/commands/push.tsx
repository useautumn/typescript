import React, {useEffect, useState} from 'react';
import {Text, Box} from 'ink';
import {
	upsertProduct,
	checkForDeletables,
	upsertFeature,
} from '../core/push.js';
import {deleteFeature, deleteProduct} from '../core/api.js';

export function Push({config}: {config: any}) {
	const [creationState, setCreationState] = useState('');
	const [deletionState, setDeletionState] = useState('');

	const [deleted, setDeleted] = useState([]);
	const [created, setCreated] = useState([]);

	let {features, products} = config;

	useEffect(() => {
		(async () => {
			let {featuresToDelete, productsToDelete} = await checkForDeletables(
				features,
				products,
			);

			for (let productId of productsToDelete) {
				setDeletionState(`Deleting product [${productId}]`);
				await deleteProduct(productId);
				setDeletionState(`Deleted product [${productId}]`);
				setDeleted([
					...deleted,
					`Product [${productId}] deleted successfully!`,
				]);
			}

			for (let feature of features) {
				setCreationState(`Pushing feature [${feature.id}]`);
				await upsertFeature(feature);
				setCreationState(`Pushed feature [${feature.id}]`);
				setCreated([
					...created,
					`Feature [${feature.id}] created successfully!`,
				]);
			}
			for (let product of products) {
				setCreationState(`Pushing product [${product.id}]`);
				await upsertProduct(product);
				setCreationState(`Pushed product [${product.id}]`);
				setCreated([
					...created,
					`Product [${product.id}] created successfully!`,
				]);
			}

			for (let featureId of featuresToDelete) {
				setDeletionState(`Deleting feature [${featureId}]`);
				await deleteFeature(featureId);
				setDeletionState(`Deleted feature [${featureId}]`);
				setDeleted([
					...deleted,
					`Feature [${featureId}] deleted successfully!`,
				]);
			}
		})();
	}, []);

	return (
		<Box flexDirection="column">
			<Text color="green">{creationState}</Text>
			<Text color="red">{deletionState}</Text>
			<Text color="green">{created.join('\n')}</Text>
			<Text color="red">{deleted.join('\n')}</Text>
		</Box>
	);
}
