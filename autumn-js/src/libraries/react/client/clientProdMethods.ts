
import type { AutumnClient } from "./ReactAutumnClient";
import Autumn from "@sdk";

export async function listProductsMethod(this: AutumnClient): Promise<Autumn.Products.ProductListResponse> {
	const res = await this.get(`${this.prefix}/products`);
	return res;
}
