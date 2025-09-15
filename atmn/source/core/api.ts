import axios, {AxiosError} from 'axios';
import chalk from 'chalk';

import {BACKEND_URL} from '../constants.js';
import {isLocalFlag, readFromEnv} from './utils.js';

let INTERNAL_BASE: string = BACKEND_URL;
let EXTERNAL_BASE: string = `${BACKEND_URL}/v1`;

export async function request({
	method,
	base,
	path,
	data,
	headers,
	customAuth,
	throwOnError = true,
	secretKey,
	queryParams,
	bypass,
}: {
	method: string;
	base: string;
	path: string;
	data?: Record<string, unknown>;
	headers?: Record<string, string>;
	customAuth?: string;
	throwOnError?: boolean;
	secretKey?: string;
	queryParams?: Record<string, string>;
	bypass?: boolean;
}) {
	if (isLocalFlag()) {
		INTERNAL_BASE = 'http://localhost:8080';
		EXTERNAL_BASE = 'http://localhost:8080/v1';

		if (base) {
			base = base.replace(BACKEND_URL, 'http://localhost:8080');
		}
	}

	const apiKey = secretKey || readFromEnv({bypass});

	try {
		const response = await axios.request({
			method,
			url: `${base}${path}`,
			data,
			params: queryParams,
			headers: {
				'Content-Type': 'application/json',
				...headers,
				Authorization: customAuth || `Bearer ${apiKey}`,
			},
		});

		return response.data;
	} catch (error: unknown) {
		if (throwOnError) {
			throw error;
		}

		// Pretty-print a concise error summary (status, code, message) without raw Axios dump
		console.error('\n' + chalk.bgRed.white.bold('  API REQUEST FAILED  '));
		const methodPath = `${method.toUpperCase()} ${base}${path}`;
		console.error(chalk.red(methodPath));

		if (error instanceof AxiosError) {
			const status = error.response?.status;
			const data = error.response?.data as any;
			const code = data?.code || data?.error || 'unknown_error';
			const message =
				data?.message || error.message || 'An unknown error occurred';

			if (status) {
				console.error(chalk.redBright(`[${status}] ${code}`));
			}
			console.error(chalk.red(message));

			// Optional: show hint for debugging if verbose mode is desired later
		} else if (error instanceof Error) {
			console.error(chalk.red(error.message));
		} else {
			console.error(chalk.red(String(error)));
		}

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
	data?: Record<string, unknown>;
	headers?: Record<string, string>;
	customAuth?: string;
}) {
	return await request({
		method,
		base: INTERNAL_BASE,
		path,
		data,
		headers,
		customAuth,
		bypass: true,
	});
}

export async function externalRequest({
	method,
	path,
	data,
	headers,
	customAuth,
	throwOnError = false,
	queryParams,
}: {
	method: string;
	path: string;
	data?: Record<string, unknown>;
	headers?: Record<string, string>;
	customAuth?: string;
	throwOnError?: boolean;
	queryParams?: Record<string, any>;
}) {
	return await request({
		method,
		base: EXTERNAL_BASE,
		path,
		data,
		headers,
		customAuth,
		throwOnError,
		queryParams,
	});
}

export async function deleteFeature({id}: {id: string}) {
	return await externalRequest({
		method: 'DELETE',
		path: `/features/${id}`,
	});
}
export async function deleteProduct({
	id,
	allVersions,
}: {
	id: string;
	allVersions?: boolean;
}) {
	return await externalRequest({
		method: 'DELETE',
		path: `/products/${id}`,
		queryParams: {all_versions: allVersions ? true : false},
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
