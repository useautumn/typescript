// import { Autumn } from "autumn-js";
// import {
//   type TrackArgsType,
//   type AttachArgsType,
//   type CheckArgsType,
//   type CheckoutArgsType,
//   type ListProductsArgsType,
//   type UsageArgsType,
//   type QueryArgsType,
//   type CancelArgsType,
//   type SetupPaymentArgsType,
//   type FetchCustomerArgsType,
// } from "../types.js";
// import { camelToSnake } from "../utils.js";

// export const fetchCustomer = async (args: FetchCustomerArgsType) => {
//   const autumn = new Autumn({
//     secretKey: args.apiKey,
//   });
//   const customer = await autumn.customers.create({
//     id: args.customer_id,
//     email: args.customer_data?.email,
//     name: args.customer_data?.name,
//     expand: args.expand,
//   });
//   return customer;
// };

// export const track = async (args: TrackArgsType) => {
//   const autumn = new Autumn({
//     secretKey: args.apiKey,
//   });

//   const res = await autumn.track(camelToSnake(args));
//   return res;
// };

// export const attach = async (args: AttachArgsType) => {
//   const autumn = new Autumn({
//     secretKey: args.apiKey,
//   });
//   const res = await autumn.attach(camelToSnake(args));
//   return res;
// };

// export const check = async (args: CheckArgsType) => {
//   const autumn = new Autumn({
//     secretKey: args.apiKey,
//   });
//   const res = await autumn.check(camelToSnake(args));
//   return res;
// };

// export const checkout = async (args: CheckoutArgsType) => {
//   const autumn = new Autumn({
//     secretKey: args.apiKey,
//   });
//   const res = await autumn.checkout(camelToSnake(args));
//   return res;
// };

// export const usage = async (args: UsageArgsType) => {
//   const autumn = new Autumn({
//     secretKey: args.apiKey,
//   });
//   const res = await autumn.usage(camelToSnake(args));
//   return res;
// };

// export const autumnQuery = async (args: QueryArgsType) => {
//   const autumn = new Autumn({
//     secretKey: args.apiKey,
//   });
//   const res = await autumn.query(camelToSnake(args));
//   return res;
// };

// export const cancel = async (args: CancelArgsType) => {
//   const autumn = new Autumn({
//     secretKey: args.apiKey,
//   });
//   const res = await autumn.cancel(camelToSnake(args));
//   return res;
// };

// export const setupPayment = async (args: SetupPaymentArgsType) => {
//   const autumn = new Autumn({
//     secretKey: args.apiKey,
//   });
//   const res = await autumn.setupPayment(camelToSnake(args));
//   return res;
// };

// export const listProducts = async (args: ListProductsArgsType) => {
//   const autumn = new Autumn({
//     secretKey: args.apiKey,
//   });
//   const res = await autumn.products.list(camelToSnake(args));
//   return res;
// };
