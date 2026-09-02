import type { Autumn as AutumnSDK } from "autumn-js";
import { type Infer, v } from "convex/values";

const stringMap = v.record(v.string(), v.any());
const stringStringMap = v.record(v.string(), v.string());
const operationId = v.string();
const featureQuantity = v.object({
  featureId: v.string(),
  quantity: v.optional(v.number()),
  adjustable: v.optional(v.boolean()),
});
const invoiceMode = v.object({
  enabled: v.boolean(),
  enablePlanImmediately: v.optional(v.boolean()),
  finalize: v.optional(v.boolean()),
  invoiceTemplateId: v.optional(v.string()),
  netTermsDays: v.optional(v.number()),
});
const prorationBehavior = v.union(
  v.literal("prorate_immediately"),
  v.literal("none")
);
const redirectMode = v.union(
  v.literal("always"),
  v.literal("if_required"),
  v.literal("never")
);
const cancelAction = v.union(
  v.literal("cancel_immediately"),
  v.literal("cancel_end_of_cycle"),
  v.literal("uncancel")
);
const refundLastPayment = v.union(v.literal("prorated"), v.literal("full"));
const customerExpand = v.union(
  v.literal("invoices"),
  v.literal("invoice_previews"),
  v.literal("trials_used"),
  v.literal("rewards"),
  v.literal("entities"),
  v.literal("referrals"),
  v.literal("payment_method"),
  v.literal("subscriptions.plan"),
  v.literal("purchases.plan"),
  v.literal("balances.feature"),
  v.literal("flags.feature"),
  v.literal("billing_controls.auto_topups.purchase_limit")
);
const entitySpendLimit = v.object({
  featureId: v.optional(v.string()),
  enabled: v.optional(v.boolean()),
  limitType: v.optional(
    v.union(v.literal("absolute"), v.literal("usage_percentage"))
  ),
  overageLimit: v.optional(v.number()),
  skipOverageBilling: v.optional(v.boolean()),
});
const entityOverageAllowed = v.object({
  featureId: v.string(),
  enabled: v.optional(v.boolean()),
});
const entityBillingControls = v.object({
  spendLimits: v.optional(v.array(entitySpendLimit)),
  overageAllowed: v.optional(v.array(entityOverageAllowed)),
});
const entityPlan = v.object({
  id: v.string(),
  versions: v.optional(v.array(v.number())),
});

export const Identifier = v.object({
  customerId: v.string(),
  customerData: v.optional(
    v.object({
      name: v.optional(v.union(v.string(), v.null())),
      email: v.optional(v.union(v.string(), v.null())),
      fingerprint: v.optional(v.union(v.string(), v.null())),
    })
  ),
});
export type Identifier = Infer<typeof Identifier>;

const checkFields = {
  featureId: v.string(),
  entityId: v.optional(v.string()),
  requiredBalance: v.optional(v.number()),
  properties: v.optional(stringMap),
  withPreview: v.optional(v.boolean()),
};

/** Read-only check. It has no field that can consume balance. */
export const CheckArgs = v.object(checkFields);
export type CheckArgs = Infer<typeof CheckArgs>;

/** Balance-consuming check. It always sends the usage event. */
export const ConsumeCheckArgs = v.object({ ...checkFields, operationId });
export type ConsumeCheckArgs = Infer<typeof ConsumeCheckArgs>;

export const TrackArgs = v.object({
  featureId: v.optional(v.string()),
  entityId: v.optional(v.string()),
  eventName: v.optional(v.string()),
  value: v.optional(v.number()),
  properties: v.optional(stringMap),
  timestamp: v.optional(v.number()),
  overageBehavior: v.optional(v.union(v.literal("cap"), v.literal("overflow"))),
  operationId,
});
export type TrackArgs = Infer<typeof TrackArgs>;

const publicPreviewAttachFields = {
  planId: v.string(),
  entityId: v.optional(v.string()),
  featureQuantities: v.optional(v.array(featureQuantity)),
  version: v.optional(v.number()),
  prorationBehavior: v.optional(prorationBehavior),
  redirectMode: v.optional(redirectMode),
  subscriptionId: v.optional(v.string()),
  successUrl: v.optional(v.string()),
  billingCycleAnchor: v.optional(v.union(v.string(), v.number())),
  startsAt: v.optional(v.number()),
  endsAt: v.optional(v.number()),
  checkoutSessionParams: v.optional(stringMap),
  longLivedCheckout: v.optional(v.boolean()),
  metadata: v.optional(stringStringMap),
  currency: v.optional(v.string()),
  removePlanIds: v.optional(v.array(v.string())),
};
const attachOperatorFields = {
  invoiceMode: v.optional(invoiceMode),
  noBillingChanges: v.optional(v.boolean()),
  enablePlanImmediately: v.optional(v.boolean()),
};
const attachFields = {
  ...publicPreviewAttachFields,
  ...attachOperatorFields,
};

export const PublicPreviewAttachArgs = v.object(publicPreviewAttachFields);
export const PreviewAttachArgs = v.object(attachFields);
export type PreviewAttachArgs = Infer<typeof PreviewAttachArgs>;
export const AttachArgs = v.object({ ...attachFields, operationId });
export type AttachArgs = Infer<typeof AttachArgs>;

const multiAttachPlan = v.object({
  planId: v.string(),
  featureQuantities: v.optional(v.array(featureQuantity)),
  version: v.optional(v.number()),
  subscriptionId: v.optional(v.string()),
  entityId: v.optional(v.union(v.string(), v.null())),
});
const publicPreviewMultiAttachFields = {
  entityId: v.optional(v.string()),
  plans: v.array(multiAttachPlan),
  startsAt: v.optional(v.number()),
  currency: v.optional(v.string()),
  billingBehavior: v.optional(prorationBehavior),
  billingCycleAnchor: v.optional(v.literal("now")),
  successUrl: v.optional(v.string()),
  checkoutSessionParams: v.optional(stringMap),
  redirectMode: v.optional(redirectMode),
  newBillingSubscription: v.optional(v.boolean()),
};
const multiAttachOperatorFields = {
  invoiceMode: v.optional(invoiceMode),
  enablePlanImmediately: v.optional(v.boolean()),
};
const multiAttachFields = {
  ...publicPreviewMultiAttachFields,
  ...multiAttachOperatorFields,
};

export const PublicPreviewMultiAttachArgs = v.object(
  publicPreviewMultiAttachFields
);
export const PreviewMultiAttachArgs = v.object(multiAttachFields);
export type PreviewMultiAttachArgs = Infer<typeof PreviewMultiAttachArgs>;
export const MultiAttachArgs = v.object({ ...multiAttachFields, operationId });
export type MultiAttachArgs = Infer<typeof MultiAttachArgs>;

const publicPreviewUpdateFields = {
  entityId: v.optional(v.string()),
  planId: v.optional(v.string()),
  featureQuantities: v.optional(v.array(featureQuantity)),
  version: v.optional(v.number()),
  prorationBehavior: v.optional(prorationBehavior),
  redirectMode: v.optional(redirectMode),
  subscriptionId: v.optional(v.string()),
  cancelAction: v.optional(cancelAction),
  billingCycleAnchor: v.optional(v.union(v.string(), v.number())),
};
const updateOperatorFields = {
  invoiceMode: v.optional(invoiceMode),
  noBillingChanges: v.optional(v.boolean()),
  refundLastPayment: v.optional(refundLastPayment),
  subscriptionParams: v.optional(stringMap),
  recalculateBalances: v.optional(v.object({ enabled: v.boolean() })),
  carryOverUsages: v.optional(
    v.object({
      enabled: v.boolean(),
      featureIds: v.optional(v.array(v.string())),
    })
  ),
};
const updateFields = {
  ...publicPreviewUpdateFields,
  ...updateOperatorFields,
};

export const PublicPreviewUpdateArgs = v.object(publicPreviewUpdateFields);
export const PreviewUpdateArgs = v.object(updateFields);
export type PreviewUpdateArgs = Infer<typeof PreviewUpdateArgs>;
export const UpdateSubscriptionArgs = v.object({
  ...updateFields,
  operationId,
});
export type UpdateSubscriptionArgs = Infer<typeof UpdateSubscriptionArgs>;

const multiUpdateItem = v.object({
  planId: v.optional(v.string()),
  subscriptionId: v.optional(v.string()),
  entityId: v.optional(v.string()),
  cancelAction,
  prorationBehavior: v.optional(prorationBehavior),
});
const publicPreviewMultiUpdateFields = {
  entityId: v.optional(v.string()),
  updates: v.array(multiUpdateItem),
};
const multiUpdateOperatorFields = {
  refundLastPayment: v.optional(refundLastPayment),
  subscriptionParams: v.optional(stringMap),
};
const multiUpdateFields = {
  ...publicPreviewMultiUpdateFields,
  ...multiUpdateOperatorFields,
};

export const PublicPreviewMultiUpdateArgs = v.object(
  publicPreviewMultiUpdateFields
);
export const PreviewMultiUpdateArgs = v.object(multiUpdateFields);
export type PreviewMultiUpdateArgs = Infer<typeof PreviewMultiUpdateArgs>;
export const MultiUpdateArgs = v.object({ ...multiUpdateFields, operationId });
export type MultiUpdateArgs = Infer<typeof MultiUpdateArgs>;

export const SetupPaymentArgs = v.object({
  planId: v.optional(v.string()),
  entityId: v.optional(v.string()),
  featureQuantities: v.optional(v.array(featureQuantity)),
  version: v.optional(v.number()),
  prorationBehavior: v.optional(prorationBehavior),
  subscriptionId: v.optional(v.string()),
  successUrl: v.optional(v.string()),
  billingCycleAnchor: v.optional(v.union(v.string(), v.number())),
  startsAt: v.optional(v.number()),
  endsAt: v.optional(v.number()),
  checkoutSessionParams: v.optional(stringMap),
  metadata: v.optional(stringStringMap),
  noBillingChanges: v.optional(v.boolean()),
  enablePlanImmediately: v.optional(v.boolean()),
  currency: v.optional(v.string()),
  removePlanIds: v.optional(v.array(v.string())),
  operationId,
});
export type SetupPaymentArgs = Infer<typeof SetupPaymentArgs>;

const publicBillingPortalFields = {
  returnUrl: v.optional(v.string()),
};
const billingPortalFields = {
  ...publicBillingPortalFields,
  configurationId: v.optional(v.string()),
};

export const PublicBillingPortalArgs = v.object(publicBillingPortalFields);
export const BillingPortalArgs = v.object(billingPortalFields);
export type BillingPortalArgs = Infer<typeof BillingPortalArgs>;

export const GetCustomerArgs = v.object({
  expand: v.optional(v.array(customerExpand)),
});
export type GetCustomerArgs = Infer<typeof GetCustomerArgs>;

export const GetOrCreateCustomerArgs = v.object({
  name: v.optional(v.union(v.string(), v.null())),
  email: v.optional(v.union(v.string(), v.null())),
  fingerprint: v.optional(v.union(v.string(), v.null())),
  metadata: v.optional(v.union(stringMap, v.null())),
  stripeId: v.optional(v.union(v.string(), v.null())),
  createInStripe: v.optional(v.boolean()),
  autoEnablePlanId: v.optional(v.string()),
  sendEmailReceipts: v.optional(v.boolean()),
  currency: v.optional(v.union(v.string(), v.null())),
  expand: v.optional(v.array(customerExpand)),
  operationId,
});
export type GetOrCreateCustomerArgs = Infer<typeof GetOrCreateCustomerArgs>;

export const UpdateCustomerArgs = v.object({
  name: v.optional(v.union(v.string(), v.null())),
  email: v.optional(v.union(v.string(), v.null())),
  fingerprint: v.optional(v.union(v.string(), v.null())),
  metadata: v.optional(v.union(stringMap, v.null())),
  stripeId: v.optional(v.union(v.string(), v.null())),
  sendEmailReceipts: v.optional(v.boolean()),
  currency: v.optional(v.union(v.string(), v.null())),
  operationId,
});
export type UpdateCustomerArgs = Infer<typeof UpdateCustomerArgs>;

export const DeleteCustomerArgs = v.object({
  deleteInStripe: v.optional(v.boolean()),
  operationId,
});
export type DeleteCustomerArgs = Infer<typeof DeleteCustomerArgs>;

export const CreateEntityArgs = v.object({
  entityId: v.string(),
  featureId: v.string(),
  name: v.optional(v.union(v.string(), v.null())),
  billingControls: v.optional(entityBillingControls),
  operationId,
});
export type CreateEntityArgs = Infer<typeof CreateEntityArgs>;

export const GetEntityArgs = v.object({ entityId: v.string() });
export type GetEntityArgs = Infer<typeof GetEntityArgs>;

export const ListEntitiesArgs = v.object({
  startCursor: v.optional(v.string()),
  limit: v.optional(v.number()),
  plans: v.optional(v.array(entityPlan)),
  subscriptionStatus: v.optional(
    v.union(v.literal("active"), v.literal("scheduled"))
  ),
  search: v.optional(v.string()),
  processors: v.optional(
    v.array(
      v.union(v.literal("stripe"), v.literal("revenuecat"), v.literal("vercel"))
    )
  ),
});
export type ListEntitiesArgs = Infer<typeof ListEntitiesArgs>;

export const UpdateEntityArgs = v.object({
  entityId: v.string(),
  billingControls: entityBillingControls,
  operationId,
});
export type UpdateEntityArgs = Infer<typeof UpdateEntityArgs>;

export const DeleteEntityArgs = v.object({
  entityId: v.string(),
  operationId,
});
export type DeleteEntityArgs = Infer<typeof DeleteEntityArgs>;

export const GetPlanArgs = v.object({
  planId: v.string(),
  version: v.optional(v.number()),
});
export type GetPlanArgs = Infer<typeof GetPlanArgs>;

export const ListPlansArgs = v.object({
  entityId: v.optional(v.string()),
  includeArchived: v.optional(v.boolean()),
  allVersions: v.optional(v.boolean()),
});
export type ListPlansArgs = Infer<typeof ListPlansArgs>;

export const UpdateBalanceArgs = v.object({
  featureId: v.string(),
  entityId: v.optional(v.string()),
  remaining: v.optional(v.number()),
  addToBalance: v.optional(v.number()),
  usage: v.optional(v.number()),
  interval: v.optional(
    v.union(
      v.literal("one_off"),
      v.literal("minute"),
      v.literal("hour"),
      v.literal("day"),
      v.literal("week"),
      v.literal("month"),
      v.literal("quarter"),
      v.literal("semi_annual"),
      v.literal("year")
    )
  ),
  includedGrant: v.optional(v.number()),
  balanceId: v.optional(v.string()),
  nextResetAt: v.optional(v.number()),
  expiresAt: v.optional(v.number()),
  operationId,
});
export type UpdateBalanceArgs = Infer<typeof UpdateBalanceArgs>;

export const ListEventsArgs = v.object({
  startCursor: v.optional(v.string()),
  limit: v.optional(v.number()),
  entityId: v.optional(v.string()),
  featureId: v.optional(v.union(v.string(), v.array(v.string()))),
  customRange: v.optional(
    v.object({
      start: v.optional(v.number()),
      end: v.optional(v.number()),
    })
  ),
});
export type ListEventsArgs = Infer<typeof ListEventsArgs>;

export const AggregateEventsArgs = v.object({
  entityId: v.optional(v.string()),
  featureId: v.union(v.string(), v.array(v.string())),
  groupBy: v.optional(v.string()),
  range: v.optional(
    v.union(
      v.literal("24h"),
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("last_cycle"),
      v.literal("1bc"),
      v.literal("3bc")
    )
  ),
  binSize: v.optional(
    v.union(
      v.literal("day"),
      v.literal("hour"),
      v.literal("week"),
      v.literal("month")
    )
  ),
  customRange: v.optional(v.object({ start: v.number(), end: v.number() })),
  filterBy: v.optional(v.record(v.string(), v.string())),
  maxGroups: v.optional(v.number()),
  aggregateOn: v.optional(v.literal("deducted")),
});
export type AggregateEventsArgs = Infer<typeof AggregateEventsArgs>;

export const CreateReferralCodeArgs = v.object({
  programId: v.string(),
  operationId,
});
export type CreateReferralCodeArgs = Infer<typeof CreateReferralCodeArgs>;

export const RedeemReferralCodeArgs = v.object({
  code: v.string(),
  operationId,
});
export type RedeemReferralCodeArgs = Infer<typeof RedeemReferralCodeArgs>;

/**
 * The customer an internal generated action operates on.
 *
 * Convex does not propagate the caller's auth into a scheduled or internal
 * call, so `identify(ctx)` cannot resolve a customer there. Each internal
 * action is reachable only from server code that has already made its own
 * authorization decision, and it takes the customer ID from that caller. The
 * field is stripped before the Autumn request is built, and it never appears on
 * a public validator.
 */
const customerId = v.string();

export const InternalConsumeCheckArgs = v.object({
  ...ConsumeCheckArgs.fields,
  customerId,
});
export type InternalConsumeCheckArgs = Infer<typeof InternalConsumeCheckArgs>;
export const InternalTrackArgs = v.object({ ...TrackArgs.fields, customerId });
export type InternalTrackArgs = Infer<typeof InternalTrackArgs>;
export const InternalAttachArgs = v.object({
  ...AttachArgs.fields,
  customerId,
});
export type InternalAttachArgs = Infer<typeof InternalAttachArgs>;
export const InternalMultiAttachArgs = v.object({
  ...MultiAttachArgs.fields,
  customerId,
});
export type InternalMultiAttachArgs = Infer<typeof InternalMultiAttachArgs>;
export const InternalUpdateSubscriptionArgs = v.object({
  ...UpdateSubscriptionArgs.fields,
  customerId,
});
export type InternalUpdateSubscriptionArgs = Infer<
  typeof InternalUpdateSubscriptionArgs
>;
export const InternalMultiUpdateArgs = v.object({
  ...MultiUpdateArgs.fields,
  customerId,
});
export type InternalMultiUpdateArgs = Infer<typeof InternalMultiUpdateArgs>;
export const InternalSetupPaymentArgs = v.object({
  ...SetupPaymentArgs.fields,
  customerId,
});
export type InternalSetupPaymentArgs = Infer<typeof InternalSetupPaymentArgs>;
export const InternalGetOrCreateCustomerArgs = v.object({
  ...GetOrCreateCustomerArgs.fields,
  customerId,
});
export type InternalGetOrCreateCustomerArgs = Infer<
  typeof InternalGetOrCreateCustomerArgs
>;
export const InternalUpdateCustomerArgs = v.object({
  ...UpdateCustomerArgs.fields,
  customerId,
});
export type InternalUpdateCustomerArgs = Infer<
  typeof InternalUpdateCustomerArgs
>;
export const InternalDeleteCustomerArgs = v.object({
  ...DeleteCustomerArgs.fields,
  customerId,
});
export type InternalDeleteCustomerArgs = Infer<
  typeof InternalDeleteCustomerArgs
>;
export const InternalCreateEntityArgs = v.object({
  ...CreateEntityArgs.fields,
  customerId,
});
export type InternalCreateEntityArgs = Infer<typeof InternalCreateEntityArgs>;
export const InternalUpdateEntityArgs = v.object({
  ...UpdateEntityArgs.fields,
  customerId,
});
export type InternalUpdateEntityArgs = Infer<typeof InternalUpdateEntityArgs>;
export const InternalDeleteEntityArgs = v.object({
  ...DeleteEntityArgs.fields,
  customerId,
});
export type InternalDeleteEntityArgs = Infer<typeof InternalDeleteEntityArgs>;
export const InternalUpdateBalanceArgs = v.object({
  ...UpdateBalanceArgs.fields,
  customerId,
});
export type InternalUpdateBalanceArgs = Infer<typeof InternalUpdateBalanceArgs>;
export const InternalCreateReferralCodeArgs = v.object({
  ...CreateReferralCodeArgs.fields,
  customerId,
});
export type InternalCreateReferralCodeArgs = Infer<
  typeof InternalCreateReferralCodeArgs
>;
export const InternalRedeemReferralCodeArgs = v.object({
  ...RedeemReferralCodeArgs.fields,
  customerId,
});
export type InternalRedeemReferralCodeArgs = Infer<
  typeof InternalRedeemReferralCodeArgs
>;

type SDK = AutumnSDK;
type Param<T> = T extends (request: infer P, ...args: never[]) => unknown
  ? NonNullable<P>
  : never;
type WithoutOperationId<T> = Omit<T, "operationId">;
type WithCustomer<T> = WithoutOperationId<T> & { customerId: string };
type ExactSubset<Local, Native> =
  Exclude<keyof Local, keyof Native> extends never
    ? Local extends Pick<Native, keyof Local & keyof Native>
      ? true
      : false
    : false;
type Assert<T extends true> = T;

type _CheckParams = Assert<
  ExactSubset<WithCustomer<CheckArgs>, Param<SDK["check"]>>
>;
type _ConsumeCheckParams = Assert<
  ExactSubset<
    WithCustomer<ConsumeCheckArgs> & { sendEvent: true },
    Param<SDK["check"]>
  >
>;
type _TrackParams = Assert<
  ExactSubset<WithCustomer<TrackArgs>, Param<SDK["track"]>>
>;
type _AttachParams = Assert<
  ExactSubset<WithCustomer<AttachArgs>, Param<SDK["billing"]["attach"]>>
>;
type _PreviewAttachParams = Assert<
  ExactSubset<
    WithCustomer<PreviewAttachArgs>,
    Param<SDK["billing"]["previewAttach"]>
  >
>;
type _MultiAttachParams = Assert<
  ExactSubset<
    WithCustomer<MultiAttachArgs>,
    Param<SDK["billing"]["multiAttach"]>
  >
>;
type _PreviewMultiAttachParams = Assert<
  ExactSubset<
    WithCustomer<PreviewMultiAttachArgs>,
    Param<SDK["billing"]["previewMultiAttach"]>
  >
>;
type _UpdateParams = Assert<
  ExactSubset<
    WithCustomer<UpdateSubscriptionArgs>,
    Param<SDK["billing"]["update"]>
  >
>;
type _PreviewUpdateParams = Assert<
  ExactSubset<
    WithCustomer<PreviewUpdateArgs>,
    Param<SDK["billing"]["previewUpdate"]>
  >
>;
type _MultiUpdateParams = Assert<
  ExactSubset<
    WithCustomer<MultiUpdateArgs>,
    Param<SDK["billing"]["multiUpdate"]>
  >
>;
type _PreviewMultiUpdateParams = Assert<
  ExactSubset<
    WithCustomer<PreviewMultiUpdateArgs>,
    Param<SDK["billing"]["previewMultiUpdate"]>
  >
>;
type _SetupPaymentParams = Assert<
  ExactSubset<
    WithCustomer<SetupPaymentArgs>,
    Param<SDK["billing"]["setupPayment"]>
  >
>;
type _PortalParams = Assert<
  ExactSubset<
    WithCustomer<BillingPortalArgs>,
    Param<SDK["billing"]["openCustomerPortal"]>
  >
>;
type _GetCustomerParams = Assert<
  ExactSubset<WithCustomer<GetCustomerArgs>, Param<SDK["customers"]["get"]>>
>;
type _GetOrCreateCustomerParams = Assert<
  ExactSubset<
    WithCustomer<GetOrCreateCustomerArgs>,
    Param<SDK["customers"]["getOrCreate"]>
  >
>;
type _UpdateCustomerParams = Assert<
  ExactSubset<
    WithCustomer<UpdateCustomerArgs>,
    Param<SDK["customers"]["update"]>
  >
>;
type _DeleteCustomerParams = Assert<
  ExactSubset<
    WithCustomer<DeleteCustomerArgs>,
    Param<SDK["customers"]["delete"]>
  >
>;
type _CreateEntityParams = Assert<
  ExactSubset<WithCustomer<CreateEntityArgs>, Param<SDK["entities"]["create"]>>
>;
type _GetEntityParams = Assert<
  ExactSubset<WithCustomer<GetEntityArgs>, Param<SDK["entities"]["get"]>>
>;
type _ListEntitiesParams = Assert<
  ExactSubset<WithCustomer<ListEntitiesArgs>, Param<SDK["entities"]["list"]>>
>;
type _UpdateEntityParams = Assert<
  ExactSubset<WithCustomer<UpdateEntityArgs>, Param<SDK["entities"]["update"]>>
>;
type _DeleteEntityParams = Assert<
  ExactSubset<WithCustomer<DeleteEntityArgs>, Param<SDK["entities"]["delete"]>>
>;
type _GetPlanParams = Assert<
  ExactSubset<GetPlanArgs, Param<SDK["plans"]["get"]>>
>;
type _ListPlansParams = Assert<
  ExactSubset<WithCustomer<ListPlansArgs>, Param<SDK["plans"]["list"]>>
>;
type _UpdateBalanceParams = Assert<
  ExactSubset<WithCustomer<UpdateBalanceArgs>, Param<SDK["balances"]["update"]>>
>;
type _ListEventsParams = Assert<
  ExactSubset<WithCustomer<ListEventsArgs>, Param<SDK["events"]["list"]>>
>;
type _AggregateEventsParams = Assert<
  ExactSubset<
    WithCustomer<AggregateEventsArgs>,
    Param<SDK["events"]["aggregate"]>
  >
>;
type _CreateReferralCodeParams = Assert<
  ExactSubset<
    WithCustomer<CreateReferralCodeArgs>,
    Param<SDK["referrals"]["createCode"]>
  >
>;
type _RedeemReferralCodeParams = Assert<
  ExactSubset<
    WithCustomer<RedeemReferralCodeArgs>,
    Param<SDK["referrals"]["redeemCode"]>
  >
>;
