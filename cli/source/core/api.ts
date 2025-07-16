import axios from 'axios';
import chalk from 'chalk';
import { readFromEnv } from './utils.js';

const INTERNAL_BASE: string = "https://api.useautumn.com";
const EXTERNAL_BASE: string = "https://api.useautumn.com/v1"

export async function request({
	method,
	base,
	path,
	data,
	headers,
	customAuth,
}: {
	method: string;
	base: string;
	path: string;
	data?: any;
	headers?: any;
	customAuth?: string;
}) {
	const apiKey = readFromEnv();

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
	} catch (error) {
		console.error(chalk.red("Error occured when making API request:"), chalk.red(error.response.data.message || error.response.data.error));
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
	})
}

export async function externalRequest({
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
		base: EXTERNAL_BASE,
		path,
		data,
		headers,
		customAuth,
	})
}

export async function deleteFeature(id: string) {
	return await externalRequest({
		method: "DELETE",
		path: `/features/${id}`,
	});
}
export async function deleteProduct(id: string) {
	return await externalRequest({
		method: "DELETE",
		path: `/products/${id}`,
	});
}

export async function updateCLIStripeKeys(
	stripeTestKey: string,
	stripeLiveKey: string,
	stripeFlowAuthKey: string,
) {
	return await internalRequest({
		method: "POST",
		path: "/dev/cli/stripe",
		data: {
			stripeTestKey,
			stripeLiveKey,
			successUrl: 'https://useautumn.com',
			defaultCurrency: 'usd',
		},
		customAuth: stripeFlowAuthKey
	})
}
