import type Autumn from "@sdk";
import type { AutumnClient } from "./ReactAutumnClient";

export async function listPlansMethod(
	this: AutumnClient,
): Promise<Autumn.Plans.PlanListResponse> {
	const res = await this.get(`${this.prefix}/plans`);
	return res;
}
