import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { request } from "../api/client.js";
import { getKey } from "../env/keys.js";
import { AppEnv } from "../env/detect.js";
import type { ApiCustomer } from "../api/endpoints/customers.js";

/**
 * Response from POST /v1/customers/list
 */
export interface ListCustomersResponse {
	list: ApiCustomer[];
	has_more: boolean;
	offset: number;
	limit: number;
	/** Number of items in CURRENT PAGE only, NOT total in DB */
	total: number;
}

export interface UseCustomersOptions {
	page: number;
	pageSize?: number;
	environment?: AppEnv;
}

/**
 * TanStack Query hook for fetching paginated customers
 */
export function useCustomers({
	page,
	pageSize = 50,
	environment = AppEnv.Sandbox,
}: UseCustomersOptions) {
	const offset = (page - 1) * pageSize;

	return useQuery({
		queryKey: ["customers", { offset, limit: pageSize, environment }],
		queryFn: async () => {
			const secretKey = getKey(environment);

			const response = await request<ListCustomersResponse>({
				method: "POST",
				path: "/v1/customers/list",
				secretKey,
				body: { limit: pageSize, offset },
			});

			return response;
		},
		placeholderData: keepPreviousData,
		staleTime: 30_000,
	});
}
