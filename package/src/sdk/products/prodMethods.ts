import { Autumn } from "../client";

import { AutumnPromise } from "../response";
import { buildPathWithQuery, staticWrapper } from "../utils";
import {
  CreateProductParams,
  DeleteProductParams,
  ListProductsParams,
  Product,
} from "./prodTypes";

export const productMethods = (instance?: Autumn) => {
  return {
    get: (id: string) => staticWrapper(getProduct, instance, { id }),
    create: (params?: CreateProductParams) =>
      staticWrapper(createProduct, instance, { params }),
    list: (params?: ListProductsParams) =>
      staticWrapper(listProducts, instance, { params }),
    delete: (id: string) => staticWrapper(deleteProduct, instance, { id }),
  };
};

export const listProducts = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params?: ListProductsParams;
}): AutumnPromise<{
  list: Product[];
}> => {
  let path = "/products_beta";
  if (params) {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    }
    const queryString = queryParams.toString();
    if (queryString) {
      path += `?${queryString}`;
    }
  }
  return instance.get(path);
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

export const deleteProduct = async ({
  instance,
  id,
  params,
}: {
  instance: Autumn;
  id: string;
  params?: DeleteProductParams;
}): AutumnPromise<{
  success: boolean;
}> => {
  // Build query params
  const path = buildPathWithQuery(`/products/${id}`, params);
  return instance.delete(path);
};
