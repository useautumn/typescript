import { Autumn } from "autumn-js";
import {
  type GetProductArgsType,
  type ListProductsArgsType,
} from "../../types.js";

export const get = async (args: GetProductArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.products.get(args.productId);
  return res;
};

export const list = async (args: ListProductsArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.products.list({
    customer_id: args.customerId,
  });
  return res;
};
