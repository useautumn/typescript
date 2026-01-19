import { z } from "zod/v4";

export enum ProductStatus {
  Active = "active",
  Expired = "expired",
  Trialing = "trialing",
  Scheduled = "scheduled",
  PastDue = "past_due",
}

export const CustomerExpandEnum = z.enum([
  "invoices",
  "rewards",
  "trials_used",
  "entities",
  "referrals",
  "payment_method",
]);

export type CustomerExpandOption =
  | "invoices"
  | "rewards"
  | "trials_used"
  | "entities"
  | "referrals"
  | "payment_method";
