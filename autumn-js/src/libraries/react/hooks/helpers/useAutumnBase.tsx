import type Autumn from "@sdk";
import type { AutumnContextParams } from "@/AutumnContext";
import type { ConvexAutumnClient } from "@/client/ConvexAutumnClient";
import type { AutumnClient } from "@/client/ReactAutumnClient";
import type {
	AttachParams,
	BillingPortalParams,
	CancelParams,
	CheckoutParams,
	SetupPaymentParams,
} from "@/clientTypes";
import { usePricingTableBase } from "../usePricingTable/usePricingTableBase";

export const useAutumnBase = ({
	// AutumnContext,
	context,
	client,
	refetchCustomer,
}: {
	// AutumnContext: React.Context<AutumnContextParams>;
	context?: AutumnContextParams;
	client: AutumnClient | ConvexAutumnClient;
	refetchCustomer?: () => Promise<Autumn.Customer>;
}) => {
	const { attachDialog } = context || {};
	const { refetch: refetchPricingTable } = usePricingTableBase({ client });

	const attachWithoutDialog = async (
		params: AttachParams,
	): Promise<Autumn.AttachResponse> => {
		const result = await client.attach(params);

		if (result.checkout_url && typeof window !== "undefined") {
			if (params.openInNewTab) {
				window.open(result.checkout_url, "_blank");
			} else {
				window.location.href = result.checkout_url;
			}
		}

		await refetchPricingTable();
		if (refetchCustomer) {
			await refetchCustomer();
		}

		attachDialog?.setOpen(false);

		return result;
	};

	const checkout = async (
		params: CheckoutParams,
	): Promise<Autumn.CheckoutResponse> => {
		const data = await client.checkout(params);
		const { ...rest } = params;

		if (params.dialog && params.productIds) {
			throw new Error(
				"Dialog and productIds are not supported together in checkout()",
			);
		}

		const hasPrepaid = data.product?.items?.some(
			(item: any) => item.usage_model === "prepaid",
		);

		const showDialog = hasPrepaid && params.dialog;

		if (data.url && !showDialog) {
			if (params.openInNewTab) {
				window.open(data.url, "_blank");
			} else {
				window.location.href = data.url;
			}

			return data;
		}

		if (params.dialog) {
			attachDialog?.setProps({ checkoutResult: data, checkoutParams: rest });
			attachDialog?.setComponent(params.dialog);
			attachDialog?.setOpen(true);
		}

		return data;
	};

	const attachWithDialog = async (
		params: AttachParams,
	): Promise<Autumn.AttachResponse | Autumn.CheckResponse> => {
		const { ...rest } = params;

		const { entityId, entityData } = params;

		const checkRes = await client.check({
			entityData,
			withPreview: true,
			entityId: entityId ?? undefined,
		});

		const preview = checkRes.preview;

		if (!preview) {
			return await attachWithoutDialog(rest);
		} else {
			attachDialog?.setProps({ preview, attachParams: rest });
			attachDialog?.setOpen(true);
		}

		return checkRes;
	};

	const attach = async (
		params: AttachParams,
	): Promise<Autumn.AttachResponse> => {
		const { dialog } = params;

		if (dialog && !attachDialog?.open) {
			attachDialog?.setComponent(dialog);
			return (await attachWithDialog(params)) as Autumn.AttachResponse;
		}

		return await attachWithoutDialog(params);
	};

	const cancel = async (
		params: CancelParams,
	): Promise<Autumn.CancelResponse> => {
		const res = await client.cancel(params);
		return res;
	};

	const openBillingPortal = async (
		params?: BillingPortalParams,
	): Promise<Autumn.BillingPortalResponse> => {
		const defaultParams = {
			openInNewTab: false,
		};

		const finalParams = {
			...defaultParams,
			...params,
		};

		const res = await client.openBillingPortal(finalParams);

		if (res.url && typeof window !== "undefined") {
			if (finalParams.openInNewTab) {
				window.open(res.url, "_blank");
			} else {
				window.open(res.url, "_self");
			}
		}

		return res;
	};

	const setupPayment = async (
		params?: SetupPaymentParams,
	): Promise<Autumn.SetupPaymentResponse> => {
		const defaultParams = {
			openInNewTab: false,
		};

		const finalParams = {
			...defaultParams,
			...(params || {}),
		};

		const res = await client.setupPayment(finalParams);

		if (res.url && typeof window !== "undefined") {
			if (finalParams.openInNewTab) {
				window.open(res.url, "_blank");
			} else {
				window.open(res.url, "_self");
			}
		}

		return res;
	};

	return {
		attach,
		cancel,
		openBillingPortal,
		setupPayment,
		checkout,
	};
};
