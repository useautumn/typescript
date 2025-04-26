import { Autumn } from "../client";

import { AutumnPromise } from "../response";
import { staticWrapper } from "../utils";
import { CreateProductParams, Product } from "./prodTypes";

export const productMethods = (instance?: Autumn) => {
  return {
    get: (id: string) => staticWrapper(getProduct, instance, { id }),
    create: (params?: CreateProductParams) =>
      staticWrapper(createProduct, instance, { params }),
  };
};

export const getProduct = async ({
  instance,
  id,
}: {
  instance: Autumn;
  id: string;
}): AutumnPromise<Product> => {
  return instance.get(`/products/${id}`);
};

export const createProduct = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params?: CreateProductParams;
}): AutumnPromise<Product> => {
  return instance.post("/products", params);
};
