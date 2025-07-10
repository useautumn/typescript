import { Product, Feature } from "../models/composeModels";

import { AuthInfo } from "../models/auth";
import {
  ProductItem,
  ProductItemInterval,
  UsageModel,
} from "../models/productItemModels";

export const product = (p: Product) => p;
export const auth = (info: AuthInfo) => info;

export function feature(f: Feature): Feature {
  return f;
}

export const featureItem = ({
  feature_id,
  included_usage,
  interval,
}: {
  feature_id: string;
  included_usage?: number;
  interval?: ProductItemInterval;
}): ProductItem => {
  return {
    included_usage,
    feature_id,
    interval,
  };
};

export const priceItem = ({
  price,
  interval,
}: {
  price: number;
  interval?: ProductItemInterval;
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
  usage_model = "pay_per_use",
}: {
  feature_id: string;
  price: number;
  interval?: ProductItemInterval;
  included_usage?: number;
  billing_units?: number;
  usage_model?: UsageModel;
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
