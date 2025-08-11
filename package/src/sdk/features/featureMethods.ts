import { Autumn } from "../client";

import { AutumnPromise } from "../response";
import { staticWrapper } from "../utils";
import { Feature } from "./featureTypes";

export const featureMethods = (instance?: Autumn) => {
  return {
    list: () => staticWrapper(listFeatures, instance, {}),
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
