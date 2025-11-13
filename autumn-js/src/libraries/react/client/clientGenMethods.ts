import type { Autumn } from "@sdk";
import type {
	AttachParams,
	BillingPortalParams,
	CancelParams,
	CheckoutParams,
	CheckParams,
	QueryParams,
	SetupPaymentParams,
} from "@/clientTypes";
import type { AutumnClient } from "./ReactAutumnClient";

export async function checkoutMethod(
	this: AutumnClient,
	params: CheckoutParams,
): Promise<Autumn.CheckoutResponse> {
	const res = await this.post(`${this.prefix}/checkout`, params);
	return res;
}

export async function attachMethod(
	this: AutumnClient,
	params: AttachParams,
): Promise<Autumn.AttachResponse> {
	const res = await this.post(`${this.prefix}/attach`, params);
	return res;
}
export async function setupPaymentMethod(
	this: AutumnClient,
	params: SetupPaymentParams,
): Promise<Autumn.SetupPaymentResponse> {
	const res = await this.post(`${this.prefix}/setup_payment`, params);
	return res;
}

export async function cancelMethod(
	this: AutumnClient,
	params: CancelParams,
): Promise<Autumn.CancelResponse> {
	const res = await this.post(`${this.prefix}/cancel`, params);
	return res;
}

export async function checkMethod(
	this: AutumnClient,
	params: CheckParams,
): Promise<Autumn.CheckResponse> {
	// Remove dialog from params
	const noDialogParams = {
		...params,
		dialog: undefined,
	};

	const res = await this.post(`${this.prefix}/check`, noDialogParams);
	return res;
}

export async function openBillingPortalMethod(
	this: AutumnClient,
	params?: BillingPortalParams,
): Promise<Autumn.BillingPortalResponse> {
	const res = await this.post(`${this.prefix}/billing_portal`, params || {});
	return res;
}

export async function queryMethod(
	this: AutumnClient,
	params: QueryParams,
): Promise<Autumn.QueryResponse> {
	const res = await this.post(`${this.prefix}/query`, params);
	return res;
}
