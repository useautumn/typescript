import { type Infer, v } from "convex/values";

export const IdentifierOpts = v.object({
	customerId: v.string(),
	customerData: v.optional(
		v.object({
			name: v.optional(v.string()),
			email: v.optional(v.string()),
		}),
	),
});

export type IdentifierOptsType = Infer<typeof IdentifierOpts>;

export const CustomerDataConvex = v.object({
	name: v.optional(v.string()),
	email: v.optional(v.string()),
	fingerprint: v.optional(v.string()),
});

export const AttachFeatureOptionsConvex = v.object({
	featureId: v.string(),
	quantity: v.number(),
});

export const TrackArgs = v.object({
	featureId: v.optional(v.string()), // Made optional to match SDK
	value: v.optional(v.number()),
	entityId: v.optional(v.string()),
	eventName: v.optional(v.string()),
	idempotencyKey: v.optional(v.string()),
	customerData: v.optional(CustomerDataConvex), // User-facing camelCase
	entityData: v.optional(v.any()), // Added to match SDK
	properties: v.optional(v.record(v.string(), v.any())),
});

export type TrackArgsType = Infer<typeof TrackArgs>;

export const CheckArgs = v.object({
	productId: v.optional(v.string()),
	featureId: v.optional(v.string()),
	requiredBalance: v.optional(v.number()),
	sendEvent: v.optional(v.boolean()),
	withPreview: v.optional(v.boolean()),
	entityId: v.optional(v.string()),
	customerData: v.optional(CustomerDataConvex), // User-facing camelCase
	entityData: v.optional(v.any()), // Added to match SDK
});

export type CheckArgsType = Infer<typeof CheckArgs>;

export const AttachArgs = v.object({
	productId: v.optional(v.string()), // Made optional to match SDK
	productIds: v.optional(v.array(v.string())),
	entityId: v.optional(v.string()),
	options: v.optional(v.array(AttachFeatureOptionsConvex)), // Changed to use proper schema
	freeTrial: v.optional(v.boolean()), // Added to match SDK
	successUrl: v.optional(v.string()),
	metadata: v.optional(v.object({})),
	forceCheckout: v.optional(v.boolean()),
	customerData: v.optional(CustomerDataConvex), // User-facing camelCase
	entityData: v.optional(v.any()), // Added to match SDK
	checkoutSessionParams: v.optional(v.record(v.string(), v.any())),
	reward: v.optional(v.string()),
	invoice: v.optional(v.boolean()), // Added to match SDK
});

export type AttachArgsType = Infer<typeof AttachArgs>;

export const CheckoutArgs = v.object({
	productId: v.string(),
	entityId: v.optional(v.string()),
	options: v.optional(v.array(AttachFeatureOptionsConvex)), // Changed to use proper schema
	forceCheckout: v.optional(v.boolean()), // Added to match SDK
	invoice: v.optional(v.boolean()), // Added to match SDK
	successUrl: v.optional(v.string()),
	customerData: v.optional(CustomerDataConvex), // User-facing camelCase
	entityData: v.optional(v.any()), // Added to match SDK
	checkoutSessionParams: v.optional(v.record(v.string(), v.any())),
	reward: v.optional(v.string()),
});

export type CheckoutArgsType = Infer<typeof CheckoutArgs>;

export const CancelArgs = v.object({
	productId: v.string(),
	entityId: v.optional(v.string()),
	cancelImmediately: v.optional(v.boolean()),
	customerData: v.optional(CustomerDataConvex),
});

export type CancelArgsType = Infer<typeof CancelArgs>;

export const UsageArgs = v.object({
	featureId: v.string(),
	value: v.number(),
	customerData: v.optional(CustomerDataConvex),
});

export type UsageArgsType = Infer<typeof UsageArgs>;

export const QueryArgs = v.object({
	featureId: v.union(v.string(), v.array(v.string())),
	range: v.optional(
		v.union(
			v.literal("24h"),
			v.literal("7d"),
			v.literal("30d"),
			v.literal("90d"),
			v.literal("last_cycle"),
		),
	),
	customerData: v.optional(CustomerDataConvex),
});

export type QueryArgsType = Infer<typeof QueryArgs>;

export const SetupPaymentArgs = v.object({
	successUrl: v.optional(v.string()),
	checkoutSessionParams: v.optional(v.record(v.string(), v.any())),
	customerData: v.optional(CustomerDataConvex),
});

export type SetupPaymentArgsType = Infer<typeof SetupPaymentArgs>;

// Entity management - fallback to manual conversion
export const EntityDataConvex = v.object({
	name: v.optional(v.string()),
	feature_id: v.string(),
	id: v.optional(v.string()),
});

// User-facing entity creation args (camelCase for user-friendly API)

// Alternative single entity creation args for convenience
export const UserCreateSingleEntityArgs = v.object({
	name: v.optional(v.string()),
	featureId: v.string(),
	id: v.optional(v.string()),
});

export const CreateEntityArgs = v.object({
	name: v.optional(v.string()),
	featureId: v.string(),
	id: v.optional(v.string()),
});

export type CreateEntityArgsType = Infer<typeof CreateEntityArgs>;

export const DeleteEntityArgs = v.object({
	customer_id: v.string(),
	entity_id: v.string(),
	apiKey: v.string(),
});

export const UserGetEntityArgs = v.object({
	entity_id: v.string(),
	expand: v.optional(v.array(v.literal("invoices"))),
});

export const GetEntityArgs = v.object({
	entityId: v.string(),
	expand: v.optional(v.array(v.literal("invoices"))),
});

export type GetEntityArgsType = Infer<typeof GetEntityArgs>;

export const ExpandArgs = v.optional(
	v.array(
		v.union(
			v.literal("payment_method"),
			v.literal("invoices"),
			v.literal("rewards"),
			v.literal("trials_used"),
			v.literal("entities"),
			v.literal("referrals"),
		),
	),
);

// Customer management
export const GetCustomerArgs = v.object({
	expand: ExpandArgs,
});
export type GetCustomerArgsType = Infer<typeof GetCustomerArgs>;

export const CreateCustomerArgs = v.object({
	id: v.optional(v.string()),
	email: v.optional(v.string()),
	name: v.optional(v.string()),
	expand: ExpandArgs,
	errorOnNotFound: v.optional(v.boolean()),
});

export type CreateCustomerArgsType = Infer<typeof CreateCustomerArgs>;

export const UpdateCustomerArgs = v.object({
	name: v.optional(v.string()),
	email: v.optional(v.string()),
	fingerprint: v.optional(v.string()),
	metadata: v.optional(v.record(v.string(), v.any())),
	stripeId: v.optional(v.string()),
});
export type UpdateCustomerArgsType = Infer<typeof UpdateCustomerArgs>;

export const DeleteCustomerArgs = v.object({
	customer_id: v.string(),
	apiKey: v.string(),
});

export const BillingPortalArgs = v.object({
	returnUrl: v.optional(v.string()),
});

export type BillingPortalArgsType = Infer<typeof BillingPortalArgs>;

export const ListProductsArgs = v.object({});

// Referral management
export const CreateReferralCodeArgs = v.object({
	programId: v.string(),
});

export type CreateReferralCodeArgsType = Infer<typeof CreateReferralCodeArgs>;

export const RedeemReferralCodeArgs = v.object({
	code: v.string(),
});

export type RedeemReferralCodeArgsType = Infer<typeof RedeemReferralCodeArgs>;

export type UserCreateSingleEntityArgsType = Infer<
	typeof UserCreateSingleEntityArgs
>;

export type DeleteEntityArgsType = Infer<typeof DeleteEntityArgs>;
export type UserGetEntityArgsType = Infer<typeof UserGetEntityArgs>;

export type DeleteCustomerArgsType = Infer<typeof DeleteCustomerArgs>;

export type ListProductsArgsType = Infer<typeof ListProductsArgs>;

// Events analytics
export const RangeEnum = v.union(
	v.literal("24h"),
	v.literal("7d"),
	v.literal("30d"),
	v.literal("90d"),
	v.literal("last_cycle"),
	v.literal("1bc"),
	v.literal("3bc"),
);

export const BinSizeEnum = v.union(v.literal("day"), v.literal("hour"));

export const EventListArgs = v.object({
	customerId: v.string(),
	featureId: v.union(v.string(), v.array(v.string())),
	startingAfter: v.optional(v.string()),
	limit: v.optional(v.number()),
	timeRange: v.optional(
		v.object({
			start: v.optional(v.number()),
			end: v.optional(v.number()),
		}),
	),
});

export type EventListArgsType = Infer<typeof EventListArgs>;

export const EventAggregateArgs = v.object({
	customerId: v.string(),
	featureId: v.union(v.string(), v.array(v.string())),
	groupBy: v.optional(v.string()),
	range: v.optional(RangeEnum),
	binSize: v.optional(BinSizeEnum),
	customRange: v.optional(
		v.object({
			start: v.number(),
			end: v.number(),
		}),
	),
});

export type EventAggregateArgsType = Infer<typeof EventAggregateArgs>;
