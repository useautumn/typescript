import {externalRequest} from '../api.js';

export const getOrg = async () => {
	const response = await externalRequest({
		method: 'GET',
		path: '/organization',
	});
	return response;
};
