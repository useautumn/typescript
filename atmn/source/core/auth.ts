import { internalRequest } from './api.js';

export async function getOTP(otp: string) {
	const response = await internalRequest({
		method: 'GET',
		path: `/dev/otp/${otp}`,
	});

	return response;
}