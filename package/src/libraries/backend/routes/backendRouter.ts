import { withAuth } from "../utils/withAuth";
import { addGenRoutes } from "./genRoutes";
import { addRoute, createRouter } from "rou3";
import {
  Autumn,
  CreateCustomerParams,
  CustomerData,
  fetchPricingTable,
} from "../../../sdk";
import { BASE_PATH } from "../constants";
import { addEntityRoutes } from "./entityRoutes";
import { addReferralRoutes } from "./referralRoutes";
import { addProductRoutes } from "./productRoutes";
import { addAnalyticsRoutes } from "./analyticsRoutes";

type RouteData = {
  handler: any;
  requireCustomer?: boolean;
};

export interface RouterOptions {
  suppressLogs?: boolean;
}

const sanitizeCustomerBody = (body: any) => {
  let bodyCopy = { ...body };
  delete bodyCopy.id;
  delete bodyCopy.name;
  delete bodyCopy.email;

  return bodyCopy;
};

const createCustomerHandler = (options?: RouterOptions) => withAuth({
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
    let res = await autumn.customers.create({
      id: customer_id,
      ...customer_data,
      ...sanitizeCustomerBody(body),
    });

    return res;
  },
  suppressLogs: options?.suppressLogs,
});

const getPricingTableHandler = (options?: RouterOptions) => withAuth({
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
      }
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
