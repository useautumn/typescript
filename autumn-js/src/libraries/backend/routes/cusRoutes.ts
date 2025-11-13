import type { Autumn } from "@sdk";
import { addRoute, type RouterContext } from "rou3";
import { BASE_PATH } from "../constants";
import { withAuth } from "../utils/withAuth";

const sanitizeCustomerBody = (body: any) => {
	const bodyCopy = { ...body };
	delete bodyCopy.id;
	delete bodyCopy.name;
	delete bodyCopy.email;

	return bodyCopy;
};

const createCustomerHandler = withAuth({
	fn: async ({
		autumn,
		customer_id,
		customer_data = {},
		body,
	}: {
		autumn: Autumn;
		customer_id: string;
		customer_data?: Autumn.CustomerData;
		body: Autumn.CustomerCreateParams;
	}) => {
		const res = await autumn.customers.create({
			id: customer_id,
			...customer_data,
			...sanitizeCustomerBody(body),
		});

		return res;
	},
});

export const addCustomerRoutes = async (router: RouterContext) => {
	addRoute(router, "POST", `${BASE_PATH}/customers`, {
		handler: createCustomerHandler,
	});
};
