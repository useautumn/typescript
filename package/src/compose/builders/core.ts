import {
  Product,
  ProductItem,
  ProductItemInterval,
  Feature,
  UsageModel,
} from "../models/core";

import { AuthInfo } from "../models/auth";

export const product = (p: Product) => p;
export const auth = (info: AuthInfo) => info;
export function feature(
  f: Omit<Feature, "display"> & { display?: Feature["display"] }
): Feature {
  let f_ = f as Feature;
  if (!f_.display) {
    f_.display = {
      singular: f_.name,
      plural: f_.name,
    };
  }
  return f_;
}

export const priceItem = ({
  price,
  interval,
}: {
  price: number;
  interval: ProductItemInterval;
}): ProductItem => {
  return {
    price,
    interval,
  };
};

export const pricedFeatureItem = ({
  feature_id,
  price,
  interval,
  included_usage = undefined,
  billing_units = 1,
  usage_model = UsageModel.Prepaid,
}: {
  feature_id: string;
  price: number;
  interval: ProductItemInterval;
  billing_units?: number;
  usage_model?: UsageModel;
  included_usage?: number;
}): ProductItem => {
  return {
    price,
    interval,
    billing_units,
    feature_id,
    usage_model,
    included_usage,
  };
};

export const featureItem = ({
  feature_id,
  included_usage,
  interval,
}: {
  feature_id: string;
  included_usage: number;
  interval?: ProductItemInterval;
}): ProductItem => {
  return {
    included_usage,
    interval,
    feature_id,
  };
};
