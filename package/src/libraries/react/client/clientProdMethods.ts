import type { AutumnPromise } from "@sdk/response";
import type { Product } from "src/sdk/products/prodTypes";
import type { AutumnClient } from "./ReactAutumnClient";
import type { ListProductsParams } from "./types/clientProdTypes";

export async function listProductsMethod(this: AutumnClient, params?: ListProductsParams): AutumnPromise<{
	list: Product[];
}> {
	let path = `${this.prefix}/products`;

	// Append query params to the path
	// available: customer_id (optional), entity_id (optional)
	const queryParams = new URLSearchParams();
	for (const [key, value] of Object.entries(params ?? {})) {
		if (value !== undefined) {
			queryParams.append(key, String(value));
		}
	}

	// minor optimization to avoid adding ? if no query params
	const queryString = queryParams.toString();
	if (queryString) {
		path += `?${queryString}`;
	}

	const res = await this.get(path);
	return res;
}
