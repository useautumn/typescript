import type { Autumn } from "@sdk";
import { addRoute, type RouterContext } from "rou3";
import { BASE_PATH } from "../constants";
import { withAuth } from "../utils/withAuth";

const listPlansHandler = withAuth({
	fn: async ({
		autumn,
		customer_id,
	}: {
		autumn: Autumn;
		customer_id: string;
	}) => {
		const result = await autumn.plans.list({
			customer_id,
		});
		return result;
	},
	requireCustomer: false,
});

export const addPlanRoutes = async (router: RouterContext) => {
	addRoute(router, "GET", `${BASE_PATH}/plans`, {
		handler: listPlansHandler,
	});
};
