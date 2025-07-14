import axios from 'axios';
import {API_KEY_VAR} from '../cli.js';

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
	const apiKey = process.env[API_KEY_VAR];

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
		base: 'http://152.67.152.51:8080',
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
		base: 'http://152.67.152.51:8080/v1',
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
