export enum ProductStatus {
  Active = "active",
  Expired = "expired",
  Trialing = "trialing",
  Scheduled = "scheduled",
  PastDue = "past_due",
}

export type CustomerExpandOption =
  | "invoices"
  | "rewards"
  | "trials_used"
  | "entities" 
  | "referrals" 
  | "payment_method";
