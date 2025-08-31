import { Autumn } from "../client";

import { AutumnPromise } from "../response";
import { staticWrapper } from "../utils";
import { Feature } from "./featureTypes";
import type {
  UpdateBalancesParams,
  UpdateBalancesResult,
} from "../customers/cusTypes";

export const featureMethods = (instance?: Autumn) => {
  return {
    list: () => staticWrapper(listFeatures, instance, {}),
    setBalances: (customer_id: string, params: UpdateBalancesParams) =>
      staticWrapper(setBalances, instance, { customer_id, params }),
  };
};

export const listFeatures = async ({
  instance,
  params,
}: {
  instance: Autumn;
  params?: {};
}): AutumnPromise<{
  list: Feature[];
}> => {
  let path = "/features";
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

export const setBalances = async ({
  instance,
  customer_id,
  params,
}: {
  instance: Autumn;
  customer_id: string;
  params: UpdateBalancesParams;
}): AutumnPromise<UpdateBalancesResult> => {
  return instance.post(`/customers/${customer_id}/balances`, {
    balances: Array.isArray(params) ? params : [params],
  });
};
