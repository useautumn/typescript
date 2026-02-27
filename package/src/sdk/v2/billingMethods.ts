import { Autumn } from "../client";
import type { AutumnPromise } from "../response";
import type {
	BillingAttachParams,
	BillingPreviewResponse,
	BillingResponse,
	BillingUpdateParams,
	MultiAttachParams,
	SetupPaymentParams,
	SetupPaymentResponse,
} from "./billingTypes";

const V2_API_VERSION = "2.1.0";

/**
 * Attaches a plan to a customer using the v2.1 billing API
 */
export const handleBillingAttach = async ({
	instance,
	params,
}: {
	instance: Autumn;
	params: BillingAttachParams;
}): AutumnPromise<BillingResponse> => {
	const finalParams = {
		...params,
		success_url: params.success_url ?? instance.defaultReturnUrl,
		redirect_mode: params.redirect_mode ?? "if_required",
	};
	return instance.postWithVersion(
		"/billing.attach",
		finalParams,
		V2_API_VERSION,
	);
};

/**
 * Updates a customer's subscription using the v2.1 billing API
 */
export const handleBillingUpdate = async ({
	instance,
	params,
}: {
	instance: Autumn;
	params: BillingUpdateParams;
}): AutumnPromise<BillingResponse> => {
	return instance.postWithVersion("/billing.update", params, V2_API_VERSION);
};

/**
 * Preview attaching a plan to a customer
 */
export const handleBillingPreviewAttach = async ({
	instance,
	params,
}: {
	instance: Autumn;
	params: BillingAttachParams;
}): AutumnPromise<BillingPreviewResponse> => {
	return instance.postWithVersion(
		"/billing.preview_attach",
		params,
		V2_API_VERSION,
	);
};

/**
 * Preview updating a customer's subscription
 */
export const handleBillingPreviewUpdate = async ({
	instance,
	params,
}: {
	instance: Autumn;
	params: BillingUpdateParams;
}): AutumnPromise<BillingPreviewResponse> => {
	return instance.postWithVersion(
		"/billing.preview_update",
		params,
		V2_API_VERSION,
	);
};

/**
 * Attaches multiple plans to a customer in a single request
 */
export const handleBillingMultiAttach = async ({
	instance,
	params,
}: {
	instance: Autumn;
	params: MultiAttachParams;
}): AutumnPromise<BillingResponse> => {
	const finalParams = {
		...params,
		success_url: params.success_url ?? instance.defaultReturnUrl,
		redirect_mode: params.redirect_mode ?? "if_required",
	};
	return instance.postWithVersion(
		"/billing.multi_attach",
		finalParams,
		V2_API_VERSION,
	);
};

/**
 * Preview attaching multiple plans to a customer
 */
export const handleBillingPreviewMultiAttach = async ({
	instance,
	params,
}: {
	instance: Autumn;
	params: MultiAttachParams;
}): AutumnPromise<BillingPreviewResponse> => {
	return instance.postWithVersion(
		"/billing.preview_multi_attach",
		params,
		V2_API_VERSION,
	);
};

/**
 * Sets up a payment method for a customer, optionally with a plan to attach after setup
 */
export const handleBillingSetupPayment = async ({
	instance,
	params,
}: {
	instance: Autumn;
	params: SetupPaymentParams;
}): AutumnPromise<SetupPaymentResponse> => {
	const finalParams = {
		...params,
		success_url: params.success_url ?? instance.defaultReturnUrl,
	};
	return instance.postWithVersion(
		"/billing.setup_payment",
		finalParams,
		V2_API_VERSION,
	);
};

/**
 * Creates the v2 billing methods object
 */
export const v2BillingMethods = (instance?: Autumn) => {
	const wrapper = <TParams, TReturn>(
		handler: (args: { instance: Autumn; params: TParams }) => Promise<TReturn>,
		params: TParams,
	): Promise<TReturn> => {
		const inst = instance || new Autumn();
		return handler({ instance: inst, params });
	};

	return {
		/**
		 * Attaches a plan to a customer, enabling access and handling billing.
		 *
		 * @param params - Attach parameters including customer ID, plan ID, and options
		 * @returns Promise resolving to billing response with checkout URL if needed
		 *
		 * @example
		 * ```typescript
		 * const result = await autumn.v2.billing.attach({
		 *   customer_id: "cus_123",
		 *   plan_id: "pro_plan",
		 *   success_url: "https://myapp.com/success"
		 * });
		 *
		 * if (result.payment_url) {
		 *   // Payment required - redirect to checkout
		 *   window.location.href = result.payment_url;
		 * }
		 * ```
		 */
		attach: (params: BillingAttachParams) =>
			wrapper(handleBillingAttach, params),

		/**
		 * Updates a customer's subscription, handling plan changes and cancellations.
		 *
		 * @param params - Update parameters including customer ID, plan ID, and cancel action
		 * @returns Promise resolving to billing response with invoice details
		 *
		 * @example
		 * ```typescript
		 * // Update to a new plan
		 * const result = await autumn.v2.billing.update({
		 *   customer_id: "cus_123",
		 *   plan_id: "enterprise_plan",
		 *   feature_quantities: [{ feature_id: "seats", quantity: 10 }]
		 * });
		 *
		 * // Cancel at end of billing cycle
		 * const cancelResult = await autumn.v2.billing.update({
		 *   customer_id: "cus_123",
		 *   plan_id: "pro_plan",
		 *   cancel_action: "cancel_end_of_cycle"
		 * });
		 * ```
		 */
		update: (params: BillingUpdateParams) =>
			wrapper(handleBillingUpdate, params),

		/**
		 * Preview what attaching a plan would cost without actually attaching it.
		 *
		 * @param params - Same parameters as attach
		 * @returns Promise resolving to preview response with line items and totals
		 *
		 * @example
		 * ```typescript
		 * const preview = await autumn.v2.billing.previewAttach({
		 *   customer_id: "cus_123",
		 *   plan_id: "pro_plan"
		 * });
		 *
		 * console.log(`Total: $${preview.total / 100}`);
		 * preview.line_items.forEach(item => {
		 *   console.log(`${item.title}: $${item.amount / 100}`);
		 * });
		 * ```
		 */
		previewAttach: (params: BillingAttachParams) =>
			wrapper(handleBillingPreviewAttach, params),

		/**
		 * Preview what updating a subscription would cost without actually updating it.
		 *
		 * @param params - Same parameters as update
		 * @returns Promise resolving to preview response with line items and totals
		 *
		 * @example
		 * ```typescript
		 * const preview = await autumn.v2.billing.previewUpdate({
		 *   customer_id: "cus_123",
		 *   plan_id: "enterprise_plan",
		 *   feature_quantities: [{ feature_id: "seats", quantity: 20 }]
		 * });
		 *
		 * console.log(`Prorated charge: $${preview.total / 100}`);
		 * ```
		 */
		previewUpdate: (params: BillingUpdateParams) =>
			wrapper(handleBillingPreviewUpdate, params),

		/**
		 * Attaches multiple plans to a customer in a single request.
		 *
		 * @param params - Multi-attach parameters including customer ID and array of plans
		 * @returns Promise resolving to billing response with checkout URL if needed
		 *
		 * @example
		 * ```typescript
		 * const result = await autumn.v2.billing.multiAttach({
		 *   customer_id: "cus_123",
		 *   plans: [
		 *     { plan_id: "base_plan" },
		 *     { plan_id: "addon_plan", feature_quantities: [{ feature_id: "seats", quantity: 5 }] }
		 *   ],
		 *   success_url: "https://myapp.com/success"
		 * });
		 * ```
		 */
		multiAttach: (params: MultiAttachParams) =>
			wrapper(handleBillingMultiAttach, params),

		/**
		 * Preview what attaching multiple plans would cost without actually attaching them.
		 *
		 * @param params - Same parameters as multiAttach
		 * @returns Promise resolving to preview response with line items and totals
		 *
		 * @example
		 * ```typescript
		 * const preview = await autumn.v2.billing.previewMultiAttach({
		 *   customer_id: "cus_123",
		 *   plans: [
		 *     { plan_id: "base_plan" },
		 *     { plan_id: "addon_plan" }
		 *   ]
		 * });
		 *
		 * console.log(`Total: $${preview.total / 100}`);
		 * ```
		 */
		previewMultiAttach: (params: MultiAttachParams) =>
			wrapper(handleBillingPreviewMultiAttach, params),

		/**
		 * Sets up a payment method for a customer. Optionally attach a plan after setup.
		 *
		 * @param params - Setup payment parameters including customer ID and optional plan
		 * @returns Promise resolving to setup payment response with redirect URL
		 *
		 * @example
		 * ```typescript
		 * // Just setup payment method
		 * const result = await autumn.v2.billing.setupPayment({
		 *   customer_id: "cus_123",
		 *   success_url: "https://myapp.com/account"
		 * });
		 *
		 * // Setup payment and attach a plan after
		 * const result = await autumn.v2.billing.setupPayment({
		 *   customer_id: "cus_123",
		 *   plan_id: "pro_plan",
		 *   success_url: "https://myapp.com/success"
		 * });
		 *
		 * // Redirect to Stripe
		 * window.location.href = result.url;
		 * ```
		 */
		setupPayment: (params: SetupPaymentParams) =>
			wrapper(handleBillingSetupPayment, params),
	};
};
