import {internalRequest} from './api.js'

export async function getOTP(otp: string) {
	// const response = await axios.get(`http://152.67.152.51:8080/dev/otp/${otp}`);
	const response = await internalRequest({
		method: "GET",
		path: `/dev/otp/${otp}`
	})
	return response.data;
}
