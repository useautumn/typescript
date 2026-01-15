import { useQuery } from "@tanstack/react-query";
import { fetchOrganizationMe } from "../api/endpoints/index.js";
import { AppEnv, getKey } from "../env/index.js";

export interface OrganizationInfo {
	name: string;
	slug: string;
	environment: "Sandbox" | "Live";
}

export function useOrganization(cwd?: string) {
	return useQuery({
		queryKey: ["organization", cwd],
		queryFn: async (): Promise<OrganizationInfo> => {
			const sandboxKey = getKey(AppEnv.Sandbox, cwd);
			const orgData = await fetchOrganizationMe({ secretKey: sandboxKey });
			
			return {
				name: orgData.name,
				slug: orgData.slug,
				environment: orgData.env === AppEnv.Sandbox ? "Sandbox" : "Live",
			};
		},
	});
}
