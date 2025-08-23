import { Autumn } from "autumn-js";
import {
  camelToSnake,
  type TrackArgsType,
  type AttachArgsType,
  type CheckArgsType,
  type CheckoutArgsType,
  type GetCustomerArgsType,
  type UpdateCustomerArgsType,
  type DeleteCustomerArgsType,
  type BillingPortalArgsType,
  type GetProductArgsType,
  type ListProductsArgsType,
  type CreateReferralCodeArgsType,
  type RedeemReferralCodeArgsType,
  type UsageArgsType,
  type QueryArgsType,
  type CancelArgsType,
  type SetupPaymentArgsType,
  type CreateEntityArgsType,
  type DeleteEntityArgsType,
  type GetEntityArgsType,
  type FetchCustomerArgsType,
} from "../../types.js";

export const fetchCustomer = async (args: FetchCustomerArgsType) => {
    const autumn = new Autumn({
      secretKey: args.apiKey,
    });
    const customer = await autumn.customers.create({
      id: args.customerId,
      email: args.customerData?.email,
      name: args.customerData?.name,
      expand: args.expand,
    });
    return customer;
};

export const track = async (args: TrackArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  console.log("Inside lib.ts track", args.customerId);
  let res = await autumn.track(camelToSnake(args));
  return res;
};

export const attach = async (args: AttachArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.attach(camelToSnake(args));
  return res;
};

export const check = async (args: CheckArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.check(camelToSnake(args));
  return res;
};

export const checkout = async (args: CheckoutArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.checkout(camelToSnake(args));
  return res;
};

export const usage = async (args: UsageArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.usage(camelToSnake(args));
  return res;
};

export const autumnQuery = async (args: QueryArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.query(camelToSnake(args));
  return res;
};

export const cancel = async (args: CancelArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.cancel(camelToSnake(args));
  return res;
};

export const setupPayment = async (args: SetupPaymentArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.setupPayment(camelToSnake(args));
  return res;
};

export const listProducts = async (args: ListProductsArgsType) => {
  const autumn = new Autumn({
    secretKey: args.apiKey,
  });
  let res = await autumn.products.list(camelToSnake(args));
  return res;
};

export * as customers from "./customers.js";
export * as entities from "./entities.js";
export * as products from "./products.js";
export * as referrals from "./referrals.js";