import { addRoute, createRouter } from "rou3";
import { BASE_PATH } from "../constants";
import { addCustomerRoutes } from "./cusRoutes";
import { addEntityRoutes } from "./entityRoutes";
import { addGenRoutes } from "./genRoutes";
import { addPlanRoutes } from "./planRoutes";
import { addReferralRoutes } from "./referralRoutes";

type RouteData = {
	handler: any;
	requireCustomer?: boolean;
};

export const createRouterWithOptions = () => {
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

	addGenRoutes(router);
	addCustomerRoutes(router);
	addEntityRoutes(router);
	addReferralRoutes(router);
	addPlanRoutes(router);

	return router;
};
