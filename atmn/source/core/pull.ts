import chalk from 'chalk';
import type {Feature, Product} from '../compose/models/composeModels.js';
import {externalRequest} from './api.js';

export async function getProducts(ids: string[]): Promise<Product[]> {
	return await Promise.all(
		ids.map(id =>
			externalRequest({
				method: 'GET',
				path: `/products/${id}`,
			}),
		),
	);
}

export async function getAllProducts(params?: {
	archived?: boolean;
}): Promise<Product[]> {
	const {list: products} = await externalRequest({
		method: 'GET',
		path: `/products`,
		queryParams: {include_archived: params?.archived ? true : false},
	});

	return [...products];
}

export async function getAllProductVariants() {
	const {list} = await externalRequest({
		method: 'GET',
		path: '/products',
	});

	const allProducts = [];
	allProducts.push(
		...list.flatMap((product: {name: string; version: number; id: string}) => {
			if (product.version > 1) {
				// Get all versions of this product
				return Array.from({length: product.version}, (_, i) => ({
					id: product.id,
					name: product.name,
					version: i + 1,
				}));
			} else {
				return [
					{
						id: product.id,
						name: product.name,
						version: product.version,
					},
				];
			}
		}),
	);
	return allProducts;
}

export async function getFeatures(params?: {includeArchived?: boolean}) {
	const {list} = await externalRequest({
		method: 'GET',
		path: '/features',
		queryParams: {include_archived: params?.includeArchived ? true : false},
	});

	return list.map((feature: Feature) => feature as Feature);
}

const MAX_RECURSION_LIMIT = 500;

export async function getCustomers(
	limit: number = 100,
	offset: number = 0,
): Promise<{id: string; text: string}[]> {
	const {list, total} = await externalRequest({
		method: 'GET',
		path: `/customers?limit=${limit}&offset=${offset}`,
	});

	const customers = list.map(
		(customer: {id: string; name: string | null; email: string | null}) => ({
			id: customer.id,
			text: customer.name || customer.email || customer.id,
		}),
	);

	if (offset + limit < total && offset < MAX_RECURSION_LIMIT) {
		const remainingCustomers = await getCustomers(limit, offset + limit);
		return [...customers, ...remainingCustomers];
	} else if (offset >= MAX_RECURSION_LIMIT) {
		console.log(
			chalk.red(
				`Reached maximum recursion limit of ${MAX_RECURSION_LIMIT} customers. Exiting.`,
			),
		);
		process.exit(1);
	}

	return customers;
}
