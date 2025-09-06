import axios from 'axios';
import chalk from 'chalk';

import {BACKEND_URL} from '../constants.js';
import {readFromEnv} from './utils.js';

const INTERNAL_BASE: string = BACKEND_URL;
const EXTERNAL_BASE: string = `${BACKEND_URL}/v1`;

export async function request({
	method,
	base,
	path,
	data,
	headers,
	customAuth,
	throwOnError = true,
	secretKey,
}: {
	method: string;
	base: string;
	path: string;
	data?: any;
	headers?: any;
	customAuth?: string;
	throwOnError?: boolean;
	secretKey?: string;
}) {
	const apiKey = secretKey || readFromEnv();

	try {
		const response = await axios.request({
			method,
			url: `${base}${path}`,
			data,
			headers: {
				'Content-Type': 'application/json',
				...headers,
				Authorization: customAuth || `Bearer ${apiKey}`,
			},
		});

		return response.data;
	} catch (error: any) {
		if (throwOnError) {
			throw error;
		}
		console.error(
			chalk.red('\nError occured when making API request:'),
			chalk.red(error.response.data.message || error.response.data.error),
		);
		process.exit(1);
	}
}

export async function internalRequest({
	method,
	path,
	data,
	headers,
	customAuth,
}: {
	method: string;
	path: string;
	data?: any;
	headers?: any;
	customAuth?: string;
}) {
	return await request({
		method,
		base: INTERNAL_BASE,
		path,
		data,
		headers,
		customAuth,
	});
}

export async function externalRequest({
	method,
	path,
	data,
	headers,
	customAuth,
	throwOnError = false,
}: {
	method: string;
	path: string;
	data?: any;
	headers?: any;
	customAuth?: string;
	throwOnError?: boolean;
}) {
	return await request({
		method,
		base: EXTERNAL_BASE,
		path,
		data,
		headers,
		customAuth,
		throwOnError,
	});
}

export async function deleteFeature(id: string) {
	return await externalRequest({
		method: 'DELETE',
		path: `/features/${id}`,
	});
}
export async function deleteProduct(id: string) {
	return await externalRequest({
		method: 'DELETE',
		path: `/products/${id}`,
	});
}

export async function updateCLIStripeKeys({
	stripeSecretKey,
	autumnSecretKey,
}: {
	stripeSecretKey: string;
	autumnSecretKey: string;
}) {
	return await request({
		base: EXTERNAL_BASE,
		method: 'POST',
		path: '/organization/stripe',
		data: {secret_key: stripeSecretKey},
		secretKey: autumnSecretKey,
	});
}
