
import { toBackendError } from "./backendRes";
import { AuthResult } from "./AuthFunction";
import { logger } from "../../../utils/logger";
import { toSnakeCase } from "@utils/toSnakeCase";
import Autumn from "@sdk";

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
    let authResult = await getCustomer();
    let customerId = authResult?.customerId;

    if (!customerId && requireCustomer) {
      if (body?.errorOnNotFound === false) {
        return {
          statusCode: 202,
          body: null,
        };
      } else {
        logger.error(
          `[Autumn]: customerId returned from identify function is ${customerId}`
        );
        return toBackendError({
          path,
          message: `customerId returned from identify function is ${customerId}`,
          code: "no_customer_id",
          statusCode: 401,
        });
      }
    }

    let cusData = authResult?.customerData || body?.customer_data;

    if (body) {
      body = toSnakeCase({
        obj: body,
        excludeChildrenOf: ["checkoutSessionParams", "properties"],
      });
    }

    try {
      return await fn({
        body,
        autumn,
        customer_id: customerId!,
        customer_data: cusData,
        pathParams,
        searchParams,
      });

    } catch (error: any) {
      logger.error(`${error.message}`);
      return toBackendError({
        path,
        message: error.message || "unknown error",
        code: "internal_error",
      });
    }
  };
};
