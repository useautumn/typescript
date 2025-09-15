import {Product} from '../../compose/index.js';
import {externalRequest} from '../api.js';

export const getProductDeleteInfo = async ({
	productId,
}: {
	productId: string;
}) => {
	const response = await externalRequest({
		method: 'GET',
		path: `/products/${productId}/deletion_info`,
	});
	return response;
};

export const updateProduct = async ({
	productId,
	update,
}: {
	productId: string;
	update: Partial<Product & {archived: boolean}>;
}) => {
	const response = await externalRequest({
		method: 'POST',
		path: `/products/${productId}`,
		data: update,
	});
	return response;
};
