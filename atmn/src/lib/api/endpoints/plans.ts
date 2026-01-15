import { request } from "../client.js";
import type { ApiPlan } from "../types/index.js";

/**
 * Fetch plans from API
 */
export interface FetchPlansOptions {
	secretKey: string;
	includeArchived?: boolean;
}

export interface FetchPlansResponse {
	list: ApiPlan[];
}

export async function fetchPlans(
	options: FetchPlansOptions,
): Promise<ApiPlan[]> {
	const { secretKey, includeArchived = true } = options;

	const response = await request<FetchPlansResponse>({
		method: "GET",
		path: "/v1/products",
		secretKey,
		queryParams: {
			include_archived: includeArchived,
		},
	});

	return response.list;
}

/**
 * Delete a single plan
 */
export async function deletePlan(options: {
	secretKey: string;
	planId: string;
	allVersions?: boolean;
}): Promise<void> {
	const { secretKey, planId, allVersions = true } = options;

	await request<void>({
		method: "DELETE",
		path: `/v1/products/${planId}`,
		secretKey,
		queryParams: {
			all_versions: allVersions,
		},
	});
}
