import { BACKEND_URL } from "../../constants.js";

/**
 * Low-level API client for making authenticated requests
 */

export interface RequestOptions {
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
	path: string;
	secretKey: string;
	body?: unknown;
	queryParams?: Record<string, string | number | boolean>;
}

export interface ApiError extends Error {
	status?: number;
	response?: unknown;
}

/**
 * Make an authenticated API request
 */
export async function request<T = unknown>(
	options: RequestOptions,
): Promise<T> {
	const { method, path, secretKey, body, queryParams } = options;

	// Build URL with query params
	const url = new URL(path, BACKEND_URL);
	if (queryParams) {
		for (const [key, value] of Object.entries(queryParams)) {
			url.searchParams.set(key, String(value));
		}
	}

	// Build request
	const headers: Record<string, string> = {
		Authorization: `Bearer ${secretKey}`,
		"Content-Type": "application/json",
		"X-API-Version": "2.0.0",
	};

	const requestInit: RequestInit = {
		method,
		headers,
	};

	if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
		requestInit.body = JSON.stringify(body);
	}

	// Make request
	try {
		const response = await fetch(url.toString(), requestInit);

		// Parse response
		let data: unknown;
		const contentType = response.headers.get("content-type");
		if (contentType?.includes("application/json")) {
			data = await response.json();
		} else {
			data = await response.text();
		}

		// Check for errors
		if (!response.ok) {
			const error = new Error(
				`API request failed: ${response.status} ${response.statusText}`,
			) as ApiError;
			error.status = response.status;
			error.response = data;
			throw error;
		}

		return data as T;
	} catch (error) {
		if (error instanceof Error && "status" in error) {
			throw error; // Re-throw API errors
		}
		// Wrap network errors
		const apiError = new Error(
			`Network request failed: ${error instanceof Error ? error.message : String(error)}`,
		) as ApiError;
		throw apiError;
	}
}
