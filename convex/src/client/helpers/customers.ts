import type { Autumn } from "autumn-js";
import { wrapSdkCall } from "./utils.js";
import {
  type GetCustomerArgsType,
  type CreateCustomerArgsType,
  type UpdateCustomerArgsType,
  type DeleteCustomerArgsType,
  type BillingPortalArgsType,
  type IdentifierOptsType,
} from "../../types.js";
import { toSnakeCase } from "../../utils.js";

export const get = async ({
  autumn,
  identifierOpts,
  args,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
  args?: GetCustomerArgsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.customers.get(identifierOpts.customerId, {
      expand: args?.expand,
    })
  );
};

export const create = async ({
  autumn,
  identifierOpts,
  args,
  useArgs = true,
}: {
  autumn: Autumn;
  identifierOpts?: IdentifierOptsType;
  args: CreateCustomerArgsType;
  useArgs?: boolean;
}) => {
  return await wrapSdkCall(() =>
    autumn.customers.create({
      id: useArgs ? identifierOpts?.customerId : args.id,
      name: useArgs ? identifierOpts?.customerData?.name : args.name,
      email: useArgs ? identifierOpts?.customerData?.email : args.email,
      ...args,
    })
  );
};

export const update = async ({
  autumn,
  identifierOpts,
  args,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
  args: UpdateCustomerArgsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.customers.update(identifierOpts.customerId, toSnakeCase(args))
  );
};

export const discard = async ({
  autumn,
  identifierOpts,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.customers.delete(identifierOpts.customerId)
  );
};

export const billingPortal = async ({
  autumn,
  identifierOpts,
  args,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
  args: BillingPortalArgsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.customers.billingPortal(identifierOpts.customerId, {
      return_url: args.returnUrl,
    })
  );
};
