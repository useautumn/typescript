import { Autumn } from "autumn-js";
import {
  type GetCustomerArgsType,
  type CreateCustomerArgsType,
  type UpdateCustomerArgsType,
  type DeleteCustomerArgsType,
  type BillingPortalArgsType,
} from "../../types.js";

export const get = async (args: GetCustomerArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.customers.get(args.customerId, {
    expand: args.expand,
  });
  return res;
};

export const create = async (args: CreateCustomerArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.customers.create({
    id: args.customerId,
    name: args.name,
    email: args.email,
  });
  return res;
};

export const update = async (args: UpdateCustomerArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.customers.update(args.customerId, {
    name: args.name,
    email: args.email,
  });
  return res;
};

export const discard = async (args: DeleteCustomerArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.customers.delete(args.customerId);
  return res;
};

export const billingPortal = async (args: BillingPortalArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.customers.billingPortal(args.customerId, {
    return_url: args.returnUrl,
  });
  return res;
};
