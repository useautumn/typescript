import { Autumn } from "../client";
import { AutumnError } from "../error";
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
}): Promise<{
  data: Product | null;
  error: AutumnError | null;
}> => {
  return instance.get(`/products/${id}`);
};

export const createProduct = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params?: CreateProductParams;
}): Promise<{
  data: Product | null;
  error: AutumnError | null;
}> => {
  return instance.post("/products", params);
};
