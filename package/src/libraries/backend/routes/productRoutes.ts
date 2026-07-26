import { addRoute, RouterContext } from "rou3";
import { Autumn } from "../../../sdk";
import { withAuth } from "../utils/withAuth";
import { BASE_PATH } from "../constants";
import type { RouterOptions } from "./backendRouter";

const listProductsHandler = (options?: RouterOptions) => withAuth({
  fn: async ({
    autumn,
    customer_id,
    searchParams,
  }: {
    autumn: Autumn;
    customer_id: string;
    searchParams?: Record<string, string>;
  }) => {
    const group = searchParams?.group || undefined;

    return await autumn.products.list({
      customer_id,
      group,
    });
  },
  requireCustomer: false,
  suppressLogs: options?.suppressLogs,
});

export const addProductRoutes = async (router: RouterContext, options?: RouterOptions) => {
  addRoute(router, "GET", `${BASE_PATH}/products`, {
    handler: listProductsHandler(options),
  });
};
