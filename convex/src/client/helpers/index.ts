import type { Autumn } from "autumn-js";
import { wrapSdkCall } from "./utils.js";
import type {
  AttachArgsType,
  CheckArgsType,
  CheckoutArgsType,
  ListProductsArgsType,
  QueryArgsType,
  CancelArgsType,
  SetupPaymentArgsType,
  FetchCustomerArgsType,
  TrackArgsType,
  IdentifierOptsType,
  UsageArgsType,
} from "../../types.js";
import { toSnakeCase } from "../../utils.js";

// export const fetchCustomer = async (args: FetchCustomerArgsType) => {
//   const autumn = new Autumn({
//     secretKey: args.apiKey,
//   });
//   return await wrapSdkCall(() =>
//     autumn.customers.create({
//       id: args.customer_id,
//       email: args.customer_data?.email || undefined,
//       name: args.customer_data?.name || undefined,
//       expand: args.expand,
//     })
//   );
// };

export const track = async ({
  autumn,
  identifierOpts,
  args,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
  args: TrackArgsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.track(
      toSnakeCase(
        {
          ...args,
          customer_id: identifierOpts.customerId,
          customer_data: identifierOpts.customerData,
        },
        ["properties"]
      )
    )
  );
};

export const check = async ({
  autumn,
  identifierOpts,
  args,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
  args: CheckArgsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.check(
      toSnakeCase({
        ...args,
        customer_id: identifierOpts.customerId,
        customer_data: identifierOpts.customerData,
      })
    )
  );
};

export const attach = async ({
  autumn,
  identifierOpts,
  args,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
  args: AttachArgsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.attach(
      toSnakeCase(
        {
          ...args,
          customer_id: identifierOpts.customerId,
          customer_data: identifierOpts.customerData,
        },
        ["checkoutSessionParams"]
      )
    )
  );
};

export const checkout = async ({
  autumn,
  identifierOpts,
  args,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
  args: CheckoutArgsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.checkout(
      toSnakeCase(
        {
          ...args,
          customer_id: identifierOpts.customerId,
          customer_data: identifierOpts.customerData,
        },
        ["checkoutSessionParams"]
      )
    )
  );
};

export const usage = async ({
  autumn,
  identifierOpts,
  args,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
  args: UsageArgsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.usage(
      toSnakeCase({
        ...args,
        customer_id: identifierOpts.customerId,
        customer_data: identifierOpts.customerData,
      })
    )
  );
};

export const autumnQuery = async ({
  autumn,
  identifierOpts,
  args,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
  args: QueryArgsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.query(
      toSnakeCase({
        ...args,
        customer_id: identifierOpts.customerId,
        customer_data: identifierOpts.customerData,
      })
    )
  );
};

export const cancel = async ({
  autumn,
  identifierOpts,
  args,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
  args: CancelArgsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.cancel(
      toSnakeCase({
        ...args,
        customer_id: identifierOpts.customerId,
        customer_data: identifierOpts.customerData,
      })
    )
  );
};

export const setupPayment = async ({
  autumn,
  identifierOpts,
  args,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
  args: SetupPaymentArgsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.setupPayment(
      toSnakeCase(
        {
          ...args,
          customer_id: identifierOpts.customerId,
          customer_data: identifierOpts.customerData,
        },
        ["checkoutSessionParams"]
      )
    )
  );
};

export const listProducts = async ({
  autumn,
  identifierOpts,
}: {
  autumn: Autumn;
  identifierOpts: IdentifierOptsType;
}) => {
  return await wrapSdkCall(() =>
    autumn.products.list({
      customer_id: identifierOpts.customerId,
    })
  );
};

export * as customers from "./customers.js";
export * as entities from "./entities.js";
export * as products from "./products.js";
export * as referrals from "./referrals.js";
