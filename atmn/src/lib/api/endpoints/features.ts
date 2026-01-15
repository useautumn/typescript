import { request } from "../client.js";
import type { ApiFeature } from "../types/index.js";

/**
 * Fetch features from API
 */
export interface FetchFeaturesOptions {
	secretKey: string;
}

export interface FetchFeaturesResponse {
	list: ApiFeature[];
}

export async function fetchFeatures(
	options: FetchFeaturesOptions,
): Promise<ApiFeature[]> {
	const { secretKey } = options;

	const response = await request<FetchFeaturesResponse>({
		method: "GET",
		path: "/v1/features",
		secretKey,
	});

	return response.list;
}

/**
 * Delete a single feature
 */
export async function deleteFeature(options: {
	secretKey: string;
	featureId: string;
}): Promise<void> {
	const { secretKey, featureId } = options;

	await request<void>({
		method: "DELETE",
		path: `/v1/features/${featureId}`,
		secretKey,
	});
}
