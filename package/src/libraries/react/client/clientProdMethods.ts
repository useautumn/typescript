import { AutumnClient } from "./ReactAutumnClient";
import { Product } from "src/sdk/products/prodTypes";
import { AutumnPromise } from "@sdk/response";

export async function listProductsMethod(this: AutumnClient): AutumnPromise<{
  list: Product[];
}> {
  const res = await this.get(`${this.prefix}/products`);
  return res;
}
