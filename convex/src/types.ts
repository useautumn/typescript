import { v, Infer } from "convex/values";

export const CustomerDataSchema = v.object({
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  fingerprint: v.optional(v.string()),
});

// User-facing args (without auth fields)
export const UserTrackArgs = v.object({
  featureId: v.string(),
  value: v.optional(v.number()),
  entityId: v.optional(v.string()),
  eventName: v.optional(v.string()),
  idempotencyKey: v.optional(v.string()),
  properties: v.optional(v.object({})),
});

export const FetchCustomerArgs = v.object({
  customerId: v.string(),
  customerData: v.optional(CustomerDataSchema),
  expand: v.optional(
    v.array(
      v.union(
        v.literal("invoices"),
        v.literal("rewards"),
        v.literal("trials_used"),
        v.literal("entities"),
        v.literal("referrals")
      )
    )
  ),
  apiKey: v.string(),
});

export type FetchCustomerArgsType = Infer<typeof FetchCustomerArgs>;

// Full args with auth fields (for internal use)
export const TrackArgs = v.object({
  featureId: v.string(),
  customerId: v.string(),
  value: v.optional(v.number()),
  entityId: v.optional(v.string()),
  eventName: v.optional(v.string()),
  idempotencyKey: v.optional(v.string()),
  properties: v.optional(v.object({})),
  customerData: v.optional(CustomerDataSchema),
  apiKey: v.string(),
});

export type TrackArgsType = Infer<typeof TrackArgs>;

// User-facing args (without auth fields)
export const UserCheckArgs = v.object({
  productId: v.optional(v.string()),
  featureId: v.optional(v.string()),
  requiredBalance: v.optional(v.number()),
  sendEvent: v.optional(v.boolean()),
  withPreview: v.optional(v.boolean()),
  entityId: v.optional(v.string()),
});

// Full args with auth fields (for internal use)
export const CheckArgs = v.object({
  customerId: v.string(),
  productId: v.optional(v.string()),
  featureId: v.optional(v.string()),
  requiredBalance: v.optional(v.number()),
  sendEvent: v.optional(v.boolean()),
  withPreview: v.optional(v.boolean()),
  entityId: v.optional(v.string()),
  customerData: v.optional(CustomerDataSchema),
  apiKey: v.string(),
});

export type CheckArgsType = Infer<typeof CheckArgs>;

// User-facing args (without auth fields)
export const UserAttachArgs = v.object({
  productId: v.string(),
  productIds: v.optional(v.array(v.string())),
  successUrl: v.optional(v.string()),
  options: v.optional(v.array(v.object({}))),
  reward: v.optional(v.string()),
  entityId: v.optional(v.string()),
  forceCheckout: v.optional(v.boolean()),
  metadata: v.optional(v.object({})),
  checkoutSessionParams: v.optional(v.object({})),
});

// Full args with auth fields (for internal use)
export const AttachArgs = v.object({
  customerId: v.string(),
  productId: v.string(),
  productIds: v.optional(v.array(v.string())),
  successUrl: v.optional(v.string()),
  options: v.optional(v.array(v.object({}))),
  reward: v.optional(v.string()),
  entityId: v.optional(v.string()),
  forceCheckout: v.optional(v.boolean()),
  customerData: v.optional(CustomerDataSchema),
  metadata: v.optional(v.object({})),
  checkoutSessionParams: v.optional(v.object({})),
  apiKey: v.string(),
});

export type AttachArgsType = Infer<typeof AttachArgs>;

// User-facing args (without auth fields)
export const UserCheckoutArgs = v.object({
  productId: v.string(),
  productIds: v.optional(v.array(v.string())),
  successUrl: v.optional(v.string()),
  options: v.optional(v.array(v.object({}))),
  reward: v.optional(v.string()),
  entityId: v.optional(v.string()),
  checkoutSessionParams: v.optional(v.object({})),
});

// Full args with auth fields (for internal use)
export const CheckoutArgs = v.object({
  customerId: v.string(),
  productId: v.string(),
  productIds: v.optional(v.array(v.string())),
  successUrl: v.optional(v.string()),
  options: v.optional(v.array(v.object({}))),
  reward: v.optional(v.string()),
  entityId: v.optional(v.string()),
  customerData: v.optional(CustomerDataSchema),
  checkoutSessionParams: v.optional(v.object({})),
  apiKey: v.string(),
});

export type CheckoutArgsType = Infer<typeof CheckoutArgs>;

export function camelToSnake<T>(input: T): any {
  if (Array.isArray(input)) {
    return input.map((item) => camelToSnake(item));
  }
  if (input !== null && typeof input === "object") {
    const result: Record<string, any> = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        result[snakeKey] = camelToSnake((input as any)[key]);
      }
    }
    return result;
  }
  return input;
}

export const EntityDataSchema = v.object({
  id: v.string(),
  name: v.string(),
  feature_id: v.string(),
});

// User-facing args (without auth fields)
export const UserCreateEntityArgs = v.object({
  entities: v.union(EntityDataSchema, v.array(EntityDataSchema)),
});

// Full args with auth fields (for internal use)
export const CreateEntityArgs = v.object({
  customerId: v.string(),
  entities: v.union(EntityDataSchema, v.array(EntityDataSchema)),
  customerData: v.optional(CustomerDataSchema),
  apiKey: v.string(),
});

export type UserCreateEntityArgsType = Infer<typeof UserCreateEntityArgs>;
export type CreateEntityArgsType = Infer<typeof CreateEntityArgs>;

export const DeleteEntityArgs = v.object({
  customerId: v.string(),
  entityId: v.string(),
  apiKey: v.string(),
});

export type DeleteEntityArgsType = Infer<typeof DeleteEntityArgs>;

// User-facing args for getting entity
export const UserGetEntityArgs = v.object({
  entityId: v.string(),
  expand: v.optional(v.array(v.string())),
});

// Full args with auth fields (for internal use)
export const GetEntityArgs = v.object({
  customerId: v.string(),
  entityId: v.string(),
  expand: v.optional(v.array(v.literal("invoices"))),
  customerData: v.optional(CustomerDataSchema),
  apiKey: v.string(),
});

export type UserGetEntityArgsType = Infer<typeof UserGetEntityArgs>;
export type GetEntityArgsType = Infer<typeof GetEntityArgs>;

// Customer methods args
export const GetCustomerArgs = v.object({
  customerId: v.string(),
  expand: v.optional(
    v.array(
      v.union(
        v.literal("invoices"),
        v.literal("rewards"),
        v.literal("trials_used"),
        v.literal("entities"),
        v.literal("referrals")
      )
    )
  ),
  apiKey: v.string(),
});

export const CreateCustomerArgs = v.object({
  customerId: v.string(),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  apiKey: v.string(),
});

export const UpdateCustomerArgs = v.object({
  customerId: v.string(),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  apiKey: v.string(),
});

export const DeleteCustomerArgs = v.object({
  customerId: v.string(),
  apiKey: v.string(),
});

export const BillingPortalArgs = v.object({
  customerId: v.string(),
  returnUrl: v.optional(v.string()),
  apiKey: v.string(),
});

// Product methods args
export const GetProductArgs = v.object({
  productId: v.string(),
  apiKey: v.string(),
});

export const ListProductsArgs = v.object({
  customerId: v.optional(v.string()),
  apiKey: v.string(),
});

// Referral methods args
export const CreateReferralCodeArgs = v.object({
  customerId: v.string(),
  programId: v.string(),
  apiKey: v.string(),
});

export const RedeemReferralCodeArgs = v.object({
  customerId: v.string(),
  code: v.string(),
  apiKey: v.string(),
});

// Additional general methods args
export const UsageArgs = v.object({
  customerId: v.string(),
  featureId: v.string(),
  value: v.number(),
  customerData: v.optional(CustomerDataSchema),
  apiKey: v.string(),
});

export const QueryArgs = v.object({
  customerId: v.string(),
  featureId: v.union(v.string(), v.array(v.string())),
  customerData: v.optional(CustomerDataSchema),
  apiKey: v.string(),
});

export const CancelArgs = v.object({
  customerId: v.string(),
  productId: v.string(),
  entityId: v.optional(v.string()),
  cancelImmediately: v.optional(v.boolean()),
  customerData: v.optional(CustomerDataSchema),
  apiKey: v.string(),
});

export const SetupPaymentArgs = v.object({
  customerId: v.string(),
  successUrl: v.optional(v.string()),
  checkoutSessionParams: v.optional(v.object({})),
  customerData: v.optional(CustomerDataSchema),
  apiKey: v.string(),
});

export type GetCustomerArgsType = Infer<typeof GetCustomerArgs>;
export type CreateCustomerArgsType = Infer<typeof CreateCustomerArgs>;
export type UpdateCustomerArgsType = Infer<typeof UpdateCustomerArgs>;
export type DeleteCustomerArgsType = Infer<typeof DeleteCustomerArgs>;
export type BillingPortalArgsType = Infer<typeof BillingPortalArgs>;
export type GetProductArgsType = Infer<typeof GetProductArgs>;
export type ListProductsArgsType = Infer<typeof ListProductsArgs>;
export type CreateReferralCodeArgsType = Infer<typeof CreateReferralCodeArgs>;
export type RedeemReferralCodeArgsType = Infer<typeof RedeemReferralCodeArgs>;
export type UsageArgsType = Infer<typeof UsageArgs>;
export type QueryArgsType = Infer<typeof QueryArgs>;
export type CancelArgsType = Infer<typeof CancelArgs>;
export type SetupPaymentArgsType = Infer<typeof SetupPaymentArgs>;
