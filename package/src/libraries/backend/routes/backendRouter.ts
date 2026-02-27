import { addRoute, createRouter } from "rou3";
import {
	type Autumn,
	type CreateCustomerParams,
	type CustomerData,
	fetchPricingTable,
} from "../../../sdk";
import { BASE_PATH } from "../constants";
import { withAuth } from "../utils/withAuth";
import { addAnalyticsRoutes } from "./analyticsRoutes";
import { addEntityRoutes } from "./entityRoutes";
import { addGenRoutes } from "./genRoutes";
import { addProductRoutes } from "./productRoutes";
import { addReferralRoutes } from "./referralRoutes";

type RouteData = {
	handler: any;
	requireCustomer?: boolean;
};

export interface RouterOptions {
	suppressLogs?: boolean;
}

const sanitizeCustomerBody = (body: any) => {
	const bodyCopy = { ...body };
	delete bodyCopy.id;
	delete bodyCopy.name;
	delete bodyCopy.email;

	return bodyCopy;
};

const createCustomerHandler = (options?: RouterOptions) =>
	withAuth({
		fn: async ({
			autumn,
			customer_id,
			customer_data = {},
			body,
		}: {
			autumn: Autumn;
			customer_id: string;
			customer_data?: CustomerData;
			body: CreateCustomerParams;
		}) => {
			console.log("Body: ", JSON.stringify(body, null, 2));
			const res = await autumn.customers.create({
				id: customer_id,
				...customer_data,
				...sanitizeCustomerBody(body),
			});

			console.log(
				"Fetched customer products: ",
				JSON.stringify(res?.data?.products, null, 2),
			);
			return res;
		},
		suppressLogs: options?.suppressLogs,
	});

const getPricingTableHandler = (options?: RouterOptions) =>
	withAuth({
		fn: async ({
			autumn,
			customer_id,
		}: {
			autumn: Autumn;
			customer_id: string;
		}) => {
			return await fetchPricingTable({
				instance: autumn,
				params: {
					customer_id: customer_id || undefined,
				},
			});
		},
		requireCustomer: false,
		suppressLogs: options?.suppressLogs,
	});

export const createRouterWithOptions = (options?: RouterOptions) => {
	const router = createRouter<RouteData>();

	addRoute(router, "POST", `${BASE_PATH}/cors`, {
		handler: () => {
			return {
				body: {
					message: "OK",
				},
				statusCode: 200,
			};
		},
	});

	addRoute(router, "POST", `${BASE_PATH}/customers`, {
		handler: createCustomerHandler(options),
	});

	addRoute(router, "GET", `${BASE_PATH}/components/pricing_table`, {
		handler: getPricingTableHandler(options),
		requireCustomer: false,
	});

	addGenRoutes(router, options);
	addEntityRoutes(router, options);
	addReferralRoutes(router, options);
	addProductRoutes(router, options);
	addAnalyticsRoutes(router, options);

	return router;
};
