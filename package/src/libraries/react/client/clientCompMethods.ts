import { AutumnClient } from "./ReactAutumnClient";
import type { AutumnPromise } from "@/utils/response";
import type { Plan } from "@useautumn/sdk/resources/shared";

export async function getPricingTableMethod(this: AutumnClient): AutumnPromise<{
  list: Plan[];
}> {
  const res = await this.get(`${this.prefix}/components/pricing_table`);
  return res;
}
