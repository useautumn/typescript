import { addRoute, RouterContext } from "rou3";
import type { Autumn, LogParams, QueryParams } from "../../../sdk";
import { withAuth } from "../utils/withAuth";
import { BASE_PATH } from "../constants";

const sanitizeBody = (body: any) => {
	const bodyCopy = { ...body };
	delete bodyCopy.customer_id;
	delete bodyCopy.customer_data;
	return bodyCopy;
};

const listEventsHandler = withAuth({
	fn: async ({
		autumn,
		customer_id,
		body,
	}: {
		autumn: Autumn;
		customer_id: string;
		body: LogParams;
	}) => {
		return await autumn.events.list({
			...sanitizeBody(body),
			customer_id,
		});
	},
});

const aggregateEventsHandler = withAuth({
	fn: async ({
		autumn,
		customer_id,
		body,
	}: {
		autumn: Autumn;
		customer_id: string;
		body: QueryParams;
	}) => {
		return await autumn.events.aggregate({
			...sanitizeBody(body),
			customer_id,
		});
	},
});

export const addAnalyticsRoutes = (router: RouterContext) => {
	addRoute(router, "POST", `${BASE_PATH}/events/list`, {
		handler: listEventsHandler,
	});
	addRoute(router, "POST", `${BASE_PATH}/events/aggregate`, {
		handler: aggregateEventsHandler,
	});
};
