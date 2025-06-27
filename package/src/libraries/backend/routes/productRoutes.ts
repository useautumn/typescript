import { addRoute, RouterContext } from "rou3";
import { Autumn } from "../../../sdk";
import { withAuth } from "../utils/withAuth";
import { BASE_PATH } from "../constants";

const listProductsHandler = withAuth({
  fn: async ({
    autumn,
    customer_id,
  }: {
    autumn: Autumn;
    customer_id: string;
  }) => {
    return await autumn.products.list({
      customer_id,
    });
  },
});

export const addProductRoutes = async (router: RouterContext) => {
  addRoute(router, "GET", `${BASE_PATH}/products`, {
    handler: listProductsHandler,
  });
};
