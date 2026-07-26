import type { AutumnPromise } from "@sdk/response";
import type { Product } from "@sdk/products/prodTypes";
import type { AutumnClient } from "./ReactAutumnClient";
import { ListProductsParams } from "./types/clientProdTypes";
import { buildPathWithQuery } from "@sdk/utils";

export async function listProductsMethod(this: AutumnClient, params?: ListProductsParams): AutumnPromise<{
	list: Product[];
}> {
	const path = buildPathWithQuery(`${this.prefix}/products`, params);
	const res = await this.get(path);
	return res;
}
