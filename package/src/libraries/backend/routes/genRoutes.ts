import { addRoute, type RouterContext } from "rou3";
import type { QueryParams } from "@/client/types/clientGenTypes";
import type {
	AttachParams,
	Autumn,
	BillingPortalParams,
	CancelParams,
	CheckoutParams,
	CheckParams,
	CustomerData,
	SetupPaymentParams,
	TrackParams,
} from "../../../sdk";
import { BASE_PATH } from "../constants";
import { withAuth } from "../utils/withAuth";
import type { RouterOptions } from "./backendRouter";

const sanitizeBody = (body: any) => {
	const bodyCopy = { ...body };
	delete bodyCopy.customer_id;
	delete bodyCopy.customer_data;
	return bodyCopy;
};

const checkoutHandler = (options?: RouterOptions) =>
	withAuth({
		fn: async ({
			autumn,
			customer_id,
			customer_data,
			body,
		}: {
			autumn: Autumn;
			customer_id: string;
			customer_data?: CustomerData;
			body: CheckoutParams;
		}) => {
			const result = await autumn.checkout({
				...sanitizeBody(body),
				customer_id,
				customer_data,
			});

			return result;
		},
		suppressLogs: options?.suppressLogs,
	});

const attachHandler = (options?: RouterOptions) =>
	withAuth({
		fn: async ({
			autumn,
			customer_id,
			customer_data,
			body,
		}: {
			autumn: Autumn;
			customer_id: string;
			customer_data?: CustomerData;
			body: AttachParams;
		}) => {
			console.log("Body: ", body);
			console.log("Customer ID: ", customer_id);
			return await autumn.attach({
				...sanitizeBody(body),
				customer_id,
				customer_data,
			});
		},
		suppressLogs: options?.suppressLogs,
	});

const setupPaymentHandler = (options?: RouterOptions) =>
	withAuth({
		fn: async ({
			autumn,
			customer_id,
			customer_data,
			body,
		}: {
			autumn: Autumn;
			customer_id: string;
			customer_data?: CustomerData;
			body: SetupPaymentParams;
		}) => {
			return await autumn.setupPayment({
				...sanitizeBody(body),
				customer_id,
				customer_data,
			});
		},
		suppressLogs: options?.suppressLogs,
	});

const cancelHandler = (options?: RouterOptions) =>
	withAuth({
		fn: async ({
			autumn,
			customer_id,
			body,
		}: {
			autumn: Autumn;
			customer_id: string;
			body: CancelParams;
		}) => {
			return await autumn.cancel({
				...sanitizeBody(body),
				customer_id,
			});
		},
		suppressLogs: options?.suppressLogs,
	});

const checkHandler = (options?: RouterOptions) =>
	withAuth({
		fn: async ({
			autumn,
			customer_id,
			customer_data,
			body,
		}: {
			autumn: Autumn;
			customer_id: string;
			customer_data?: CustomerData;
			body: CheckParams;
		}) => {
			const result = await autumn.check({
				...sanitizeBody(body),
				customer_id,
				customer_data,
			});

			return result;
		},
		suppressLogs: options?.suppressLogs,
	});

const trackHandler = (options?: RouterOptions) =>
	withAuth({
		fn: async ({
			autumn,
			customer_id,
			customer_data,
			body,
		}: {
			autumn: Autumn;
			customer_id: string;
			customer_data?: CustomerData;
			body: TrackParams;
		}) => {
			return await autumn.track({
				...sanitizeBody(body),
				customer_id,
				customer_data,
			});
		},
		suppressLogs: options?.suppressLogs,
	});

const openBillingPortalHandler = (options?: RouterOptions) =>
	withAuth({
		fn: async ({
			autumn,
			customer_id,
			body,
		}: {
			autumn: Autumn;
			customer_id: string;
			body: BillingPortalParams;
		}) => {
			return await autumn.customers.billingPortal(customer_id, body);
		},
		suppressLogs: options?.suppressLogs,
	});

const queryHandler = (options?: RouterOptions) =>
	withAuth({
		fn: async ({
			autumn,
			customer_id,
			body,
		}: {
			autumn: Autumn;
			customer_id: string;
			body: QueryParams;
		}) => {
			return await autumn.query({
				...sanitizeBody(body),
				customer_id,
			});
		},
		suppressLogs: options?.suppressLogs,
	});

const addGenRoutes = (router: RouterContext, options?: RouterOptions) => {
	addRoute(router, "POST", `${BASE_PATH}/checkout`, {
		handler: checkoutHandler(options),
	});
	addRoute(router, "POST", `${BASE_PATH}/attach`, {
		handler: attachHandler(options),
	});
	addRoute(router, "POST", `${BASE_PATH}/cancel`, {
		handler: cancelHandler(options),
	});
	addRoute(router, "POST", `${BASE_PATH}/check`, {
		handler: checkHandler(options),
	});
	addRoute(router, "POST", `${BASE_PATH}/track`, {
		handler: trackHandler(options),
	});
	addRoute(router, "POST", `${BASE_PATH}/billing_portal`, {
		handler: openBillingPortalHandler(options),
	});
	addRoute(router, "POST", `${BASE_PATH}/setup_payment`, {
		handler: setupPaymentHandler(options),
	});
	addRoute(router, "POST", `${BASE_PATH}/query`, {
		handler: queryHandler(options),
	});
};

export { addGenRoutes };
