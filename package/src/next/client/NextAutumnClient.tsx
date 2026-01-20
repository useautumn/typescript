// import {
//   CustomerData,
//   CreateCustomerParams,
//   AutumnPromise,
//   TrackResult,
//   CheckResult,
//   CancelResult,
//   Entity,
//   DeleteEntityResult,
//   RedeemReferralCodeParams,
// } from "../../../../ts-sdk/src/resources/index";

import type {
	CancelResponse,
	CheckResponse,
	CustomerCreateParams,
	CustomerData,
	Entity,
	EntityDeleteResponse,
	ReferralRedeemCodeParams,
	TrackResponse,
} from "@useautumn/sdk/resources";
import type { AutumnPromise } from "@/utils/response";
import { AutumnClient } from "../../libraries/react/client/ReactAutumnClient";
import type {
	CreateEntityParams,
	GetEntityParams,
} from "../../libraries/react/client/types/clientEntTypes";
import type {
	CancelParams,
	CheckParams,
	OpenBillingPortalParams,
	TrackParams,
} from "../../libraries/react/client/types/clientGenTypes";
import type { CreateReferralCodeParams } from "../../libraries/react/client/types/clientReferralTypes";
import { getPricingTableAction } from "../server/componentActions";
import {
	createCusAction,
	createEntityAction,
	deleteEntityAction,
	getEntityAction,
} from "../server/cusActions";
import {
	cancelAction,
	checkAction,
	getBillingPortalAction,
	trackAction,
} from "../server/genActions";

export interface ErrorResponse {
	message: string;
	code: string;
}

export type OmitCustomerType =
	| "id"
	| "name"
	| "email"
	| "fingerprint"
	| "customer_id";

export interface NextAutumnClientConfig {
	encryptedCustomerId?: string;
	customerData?: CustomerData;
	defaultReturnUrl?: string;
}

export class NextAutumnClient extends AutumnClient {
	private readonly encryptedCustomerId?: string;

	constructor({
		encryptedCustomerId,
		customerData,
		defaultReturnUrl,
	}: NextAutumnClientConfig) {
		super({
			customerData,
			defaultReturnUrl,
		});
		this.encryptedCustomerId = encryptedCustomerId;
	}

	// Override createCustomer to use Next.js server actions instead of HTTP requests
	async createCustomer(
		params: Omit<CustomerCreateParams, "id" | "data"> & {
			errorOnNotFound?: boolean;
		},
	) {
		const res = await createCusAction({
			encryptedCustomerId: this.encryptedCustomerId,
			customerData: this.customerData,
			...params,
		});

		return res;
	}

	// Pricing table
	async getPricingTable() {
		return await getPricingTableAction({
			encryptedCustomerId: this.encryptedCustomerId,
		});
	}

	// Entities
	// attach = async (params: AttachParams): AutumnPromise<AttachResult> => {
	// 	const res = await attachAction({
	// 		encryptedCustomerId: this.encryptedCustomerId,
	// 		customerData: this.customerData,
	// 		...params,
	// 	});
	// 	return res;
	// };

	cancel = async (params: CancelParams): AutumnPromise<CancelResponse> => {
		return await cancelAction({
			encryptedCustomerId: this.encryptedCustomerId,
			...params,
		});
	};

	check = async (params: CheckParams): AutumnPromise<CheckResponse> => {
		return await checkAction({
			encryptedCustomerId: this.encryptedCustomerId,
			...params,
		});
	};

	track = async (params: TrackParams): AutumnPromise<TrackResponse> => {
		return await trackAction({
			encryptedCustomerId: this.encryptedCustomerId,
			...params,
		});
	};

	openBillingPortal = async (params?: OpenBillingPortalParams | undefined) => {
		return await getBillingPortalAction({
			encryptedCustomerId: this.encryptedCustomerId,
			...(params || {}),
		});
	};

	entities = {
		create: async (
			params: CreateEntityParams | CreateEntityParams[],
		): AutumnPromise<Entity | Entity[]> => {
			return await createEntityAction({
				encryptedCustomerId: this.encryptedCustomerId,
				entity: params,
			});
		},
		get: async (
			entityId: string,
			params?: GetEntityParams,
		): AutumnPromise<Entity> => {
			return await getEntityAction({
				encryptedCustomerId: this.encryptedCustomerId,
				entityId,
				...params,
			});
		},
		delete: async (entityId: string): AutumnPromise<EntityDeleteResponse> => {
			return await deleteEntityAction({
				encryptedCustomerId: this.encryptedCustomerId,
				entityId,
			});
		},
	};

	referrals: any = {
		createCode: async (params: CreateReferralCodeParams) => {
			throw new Error("Not implemented");
		},
		redeemCode: async (params: ReferralRedeemCodeParams) => {
			throw new Error("Not implemented");
		},
	};
}
