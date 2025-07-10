import axios from 'axios';

export async function request(method: string, path: string, data?: any) {
	const response = await axios.request({
		method,
		url: `http://152.67.152.51:8080/v1${path}`,
		// url: `http://localhost:8080/v1${path}`,
		data,
		headers: {
			Authorization: `Bearer ${process.env['AUTUMN_API_KEY']}`,
			'Content-Type': 'application/json',
		},
	});
	return response.data;
}

export async function deleteFeature(id: string) {
	return await request('DELETE', `/features/${id}`);
}
export async function deleteProduct(id: string) {
	return await request('DELETE', `/products/${id}`);
}
