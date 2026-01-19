import { useQuery } from "@tanstack/react-query";
import { request } from "../api/client.js";
import { getKey } from "../env/keys.js";
import { AppEnv } from "../env/detect.js";
import type { ApiCustomerExpanded } from "../../views/react/customers/types.js";

/**
 * All expand params for full customer data (comma-separated for query string)
 */
const EXPAND_PARAMS = [
	"invoices",
	"rewards",
	"entities",
	"referrals",
	"subscriptions.plan",
	"scheduled_subscriptions.plan",
	"balances.feature",
].join(",");

export interface UseCustomerExpandedOptions {
	/** Customer ID to fetch */
	customerId: string | null;
	/** Environment (sandbox/live) */
	environment?: AppEnv;
	/** Whether to enable the query */
	enabled?: boolean;
}

/**
 * TanStack Query hook for fetching a single customer with all expand params.
 * Use this to lazily load full customer details when the sheet opens.
 */
export function useCustomerExpanded({
	customerId,
	environment = AppEnv.Sandbox,
	enabled = true,
}: UseCustomerExpandedOptions) {
	return useQuery({
		queryKey: ["customer", customerId, "expanded", environment],
		queryFn: async () => {
			if (!customerId) {
				throw new Error("Customer ID is required");
			}

			const secretKey = getKey(environment);

			const response = await request<ApiCustomerExpanded>({
				method: "GET",
				path: `/v1/customers/${encodeURIComponent(customerId)}`,
				secretKey,
				queryParams: {
					expand: EXPAND_PARAMS,
				},
			});

			return response;
		},
		enabled: enabled && !!customerId,
		staleTime: 30_000,
		// Don't refetch on window focus for detail views
		refetchOnWindowFocus: false,
	});
}
