import type { Autumn, EventsListParams, QueryParams } from "@sdk";
import { addRoute, type RouterContext } from "rou3";
import { BASE_PATH } from "../constants";
import { withAuth } from "../utils/withAuth";
import type { RouterOptions } from "./backendRouter";

const sanitizeBody = (body: any) => {
	const bodyCopy = { ...body };
	delete bodyCopy.customer_id;
	delete bodyCopy.customer_data;
	return bodyCopy;
};

const listEventsHandler = (options?: RouterOptions) => withAuth({
	fn: async ({
		autumn,
		customer_id,
		body,
	}: {
		autumn: Autumn;
		customer_id: string;
		body: EventsListParams;
	}) => {
		return await autumn.events.list({
			...sanitizeBody(body),
			customer_id,
		});
	},
	suppressLogs: options?.suppressLogs,
});

const aggregateEventsHandler = (options?: RouterOptions) => withAuth({
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
	suppressLogs: options?.suppressLogs,
});

export const addAnalyticsRoutes = (router: RouterContext, options?: RouterOptions) => {
	addRoute(router, "POST", `${BASE_PATH}/events/list`, {
		handler: listEventsHandler(options),
	});
	addRoute(router, "POST", `${BASE_PATH}/events/aggregate`, {
		handler: aggregateEventsHandler(options),
	});
};
