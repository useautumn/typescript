import type { AutumnPromise } from "@/utils/response";
import type { Plan } from "@useautumn/sdk/resources/shared";
import type { AutumnClient } from "./ReactAutumnClient";

export async function listProductsMethod(this: AutumnClient): AutumnPromise<{
	list: Plan[];
}> {
	const res = await this.get(`${this.prefix}/products`);
	return res;
}
