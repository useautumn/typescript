import axios from 'axios';

export async function getOTP(otp: string) {
	const response = await axios.get(`http://152.67.152.51:8080/dev/otp/${otp}`);
	return response.data;
}
