export * from "./client";
export * from "./components/componentMethods";
export * from "./components/componentTypes";
export * from "./customers/cusEnums";
export * from "./customers/cusTypes";
export {
	BillingPortalParamsSchema,
	CoreCusFeatureSchema,
	CreateCustomerParamsSchema,
	CustomerDataSchema,
	UpdateBalancesParamsSchema,
} from "./customers/cusTypes";
export * from "./customers/entities/entEnums";
export * from "./customers/entities/entTypes";
export {
	EntityDataSchema,
	TransferProductParamsSchema,
} from "./customers/entities/entTypes";
export * from "./error";
export * from "./events/eventTypes";
export { FeatureSchema } from "./features/featureTypes";
export * from "./general/attachTypes";
export {
	AttachFeatureOptionsSchema,
	AttachParamsSchema,
	AttachResultSchema,
	CheckoutParamsSchema,
} from "./general/attachTypes";
export * from "./general/checkTypes";
export { CheckFeatureResultSchema } from "./general/checkTypes";
export * from "./general/genEnums";
export * from "./general/genTypes";
// Export Zod schemas for convex integration
export {
	CancelParamsSchema,
	CancelResultSchema,
	CheckParamsSchema,
	TrackParamsSchema,
	TrackResultSchema,
} from "./general/genTypes";
export * from "./products/prodEnums";
export * from "./products/prodTypes";
export * from "./referrals/referralTypes";

export {
	CreateReferralCodeParamsSchema,
	RedeemReferralCodeParamsSchema,
} from "./referrals/referralTypes";
export * from "./balances/balancesTypes";
export { CreateBalanceParamsSchema } from "./balances/balancesTypes";
export type { AutumnPromise } from "./response";
export { toContainerResult } from "./response";

// V2 API exports
export {
  // Schemas
  BillingAttachParamsSchema,
  BillingUpdateParamsSchema,
  BillingResponseSchema,
  BillingRequiredActionSchema,
  FeatureQuantityParamsSchema,
  FreeTrialParamsSchema,
  AttachDiscountSchema,
  InvoiceModeParamsSchema,
  ProrationBehaviorSchema,
  RedirectModeSchema,
  PlanScheduleSchema,
  CancelActionSchema,
  CustomizePlanSchema,
  BasePriceParamsSchema,
  CreatePlanItemParamsSchema,
  UsageTierSchema,
  PaymentFailureCodeSchema,
  BillingIntervalSchema,
  BillingMethodSchema,
  OnIncreaseSchema,
  OnDecreaseSchema,
  RolloverExpiryDurationTypeSchema,
  // Multi-attach schemas
  MultiAttachParamsSchema,
  MultiAttachPlanSchema,
  MultiAttachCustomizePlanSchema,
  // Setup payment schemas
  SetupPaymentParamsSchema as V2SetupPaymentParamsSchema,
  SetupPaymentResponseSchema,
  // Preview schemas
  BillingPreviewResponseSchema,
  PreviewLineItemSchema,
  // Types
  type BillingAttachParams,
  type BillingUpdateParams,
  type BillingResponse,
  type BillingRequiredAction,
  type FeatureQuantityParams,
  type FreeTrialParams,
  type AttachDiscount,
  type InvoiceModeParams,
  type ProrationBehavior,
  type RedirectMode,
  type PlanSchedule,
  type CancelAction,
  type CustomizePlan,
  type BasePriceParams,
  type CreatePlanItemParams,
  type UsageTier,
  type PaymentFailureCode,
  type BillingInterval,
  type BillingMethod,
  type OnIncrease,
  type OnDecrease,
  type RolloverExpiryDurationType,
  // Multi-attach types
  type MultiAttachParams,
  type MultiAttachPlan,
  type MultiAttachCustomizePlan,
  // Setup payment types
  type SetupPaymentParams as V2SetupPaymentParams,
  type SetupPaymentResponse,
  // Preview types
  type BillingPreviewResponse,
  type PreviewLineItem,
} from "./v2/billingTypes";
export { v2BillingMethods } from "./v2/billingMethods";
