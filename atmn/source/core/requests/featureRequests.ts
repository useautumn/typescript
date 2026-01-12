import type { Feature } from "../../compose/index.js";
import { externalRequest } from "../api.js";

export const updateFeature = async ({
	id,
	update,
}: {
	id: string;
	update: Partial<Feature & { archived: boolean }>;
}) => {
	return await externalRequest({
		method: "POST",
		path: `/features/${id}`,
		data: update,
	});
};

export const checkFeatureDeletionData = async ({
	featureId,
}: {
	featureId: string;
}) => {
	const res = await externalRequest({
		method: "GET",
		path: `/features/${featureId}/deletion_info`,
	});

	return res;
};
