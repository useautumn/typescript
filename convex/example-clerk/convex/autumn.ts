import { api, components, internal } from "./_generated/api";
import { Autumn } from "@atmn-hq/convex";
import { verifyToken } from "@clerk/backend";
import { identify } from "./identify";

export const autumn = new Autumn(components.autumn, {
  identify: identify,
  apiKey: process.env.AUTUMN_SECRET_KEY ?? "",
});

export const { track, cancel, setupPayment, query, attach, check, checkout, createEntity, deleteEntity, getEntity, usage, listProducts, getCustomer, getProduct } = autumn.api();

export default autumn;