import { externalRequest } from "../api.js";

export const getOrg = async () => {
	const response = await externalRequest({
		method: "GET",
		path: "/organization",
	});
	return response;
};

export const getOrgMe = async (): Promise<{ name: string; slug: string; env: string }> => {
	const response = await externalRequest({
		method: "GET",
		path: "/organization/me",
	});
	return response;
};
