import {Plan} from '../../compose/index.js';
import {externalRequest} from '../api.js';

export const getPlanDeleteInfo = async ({
	planId,
}: {
	planId: string;
}) => {
	const response = await externalRequest({
		method: 'GET',
		path: `/products/${planId}/deletion_info`,
	});
	return response;
};

export const updatePlan = async ({
	planId,
	update,
}: {
	planId: string;
	update: Partial<Plan & {archived: boolean}>;
}) => {
	const response = await externalRequest({
		method: 'POST',
		path: `/products/${planId}`,
		data: update,
	});
	return response;
};
