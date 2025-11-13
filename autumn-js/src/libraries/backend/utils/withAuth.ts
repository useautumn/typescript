import Autumn from "@sdk";
import { toSnakeCase } from "@utils/toSnakeCase";
import { logger } from "../../../utils/logger";
import type { AuthResult } from "./AuthFunction";
import { toBackendError } from "./backendRes";

// 1. Takes in
export const withAuth = <T extends {}>({
	fn,
	requireCustomer = true,
}: {
	fn: (args: {
		autumn: Autumn;
		body: any;
		customer_id: string;
		customer_data?: Autumn.CustomerData;
		pathParams?: Record<string, string>;
		searchParams?: Record<string, string>;
	}) => Promise<any>;
	requireCustomer?: boolean;
}) => {
	return async ({
		autumn,
		body,
		path,
		getCustomer,
		pathParams,
		searchParams,
	}: {
		autumn: Autumn;
		body: any;
		path: string;
		getCustomer: () => AuthResult;
		pathParams?: Record<string, string>;
		searchParams?: Record<string, string>;
	}) => {
		const authResult = await getCustomer();
		const customerId = authResult?.customerId;

		if (!customerId && requireCustomer) {
			if (body?.errorOnNotFound === false) {
				return {
					statusCode: 202,
					body: null,
				};
			} else {
				logger.error(
					`[Autumn]: customerId returned from identify function is ${customerId}`,
				);
				return toBackendError({
					path,
					message: `customerId returned from identify function is ${customerId}`,
					code: "no_customer_id",
					statusCode: 401,
				});
			}
		}

		const cusData = authResult?.customerData || body?.customer_data;

		if (body) {
			body = toSnakeCase({
				obj: body,
				excludeChildrenOf: ["checkoutSessionParams", "properties"],
			});
		}

		try {
			const result = await fn({
				body,
				autumn,
				customer_id: customerId ?? "",
				customer_data: cusData,
				pathParams,
				searchParams,
			});

			return {
				statusCode: 200,
				body: result,
			};
		} catch (error) {
			if (error instanceof Autumn.APIError) {
				const statusCode = error.status;
				const data = error.error;
				return toBackendError({
					path,
					message: data.message || "unknown error",
					code: data.code || "internal_error",
					statusCode,
				});
			} else {
				return toBackendError({
					path,
					message: error instanceof Error ? error.message : "unknown error",
					code: "internal_error",
					statusCode: 500,
				});
			}
		}
	};
};
