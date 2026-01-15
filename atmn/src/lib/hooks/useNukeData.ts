/**
 * useNukeData hook - Fetch data needed for nuke UI
 */

import { useQuery } from "@tanstack/react-query";
import { getKey } from "../env/index.js";
import { AppEnv } from "../env/detect.js";
import { fetchCustomers } from "../api/endpoints/customers.js";
import { fetchPlans } from "../api/endpoints/plans.js";
import { fetchFeatures } from "../api/endpoints/features.js";
import { getOrgMe } from "../../../source/core/requests/orgRequests.js";

export interface NukeData {
	orgName: string;
	orgSlug: string;
	customersCount: number;
	plansCount: number;
	featuresCount: number;
}

/**
 * Fetch organization info and counts for nuke UI
 */
export function useNukeData() {
	return useQuery({
		queryKey: ["nuke-data"],
		queryFn: async (): Promise<NukeData> => {
			const secretKey = getKey(AppEnv.Sandbox);

			// Fetch all data in parallel
			const [org, customers, plans, features] = await Promise.all([
				getOrgMe(),
				fetchCustomers({ secretKey }),
				fetchPlans({ secretKey, includeArchived: true }),
				fetchFeatures({ secretKey }),
			]);

			return {
				orgName: org.name,
				orgSlug: org.slug,
				customersCount: customers.length,
				plansCount: plans.length,
				featuresCount: features.length,
			};
		},
		staleTime: 0, // Always fetch fresh data
		retry: 1,
	});
}
