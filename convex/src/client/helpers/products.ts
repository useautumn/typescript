import type { Autumn } from "autumn-js";
import { type IdentifierOptsType } from "../../types.js";
import { wrapSdkCall } from "./utils.js";

export const get = async ({
  autumn,
  productId,
}: {
  autumn: Autumn;
  productId: string;
}) => {
  return await wrapSdkCall(() => autumn.products.get(productId));
};

export const list = async ({
  autumn,
  identifierOpts,
}: {
  autumn: Autumn;
  identifierOpts?: IdentifierOptsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.products.list({
      customer_id: identifierOpts?.customerId ?? undefined,
    })
  );
};
