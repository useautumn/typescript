import { CustomerData, CreateCustomerParams, AutumnPromise, BillingPortalResponse, TrackResult, CheckResult, CancelResult, AttachResult, Entity, DeleteEntityResult, CreateReferralCodeResult, RedeemReferralCodeParams, RedeemReferralCodeResult } from "../../sdk";
import { AutumnClient } from "../../libraries/react/client/ReactAutumnClient";

import { createCusAction, createEntityAction, deleteEntityAction, getEntityAction } from "../server/cusActions";
import { getPricingTableAction } from "../server/componentActions";

import { AttachParams, CancelParams, TrackParams,OpenBillingPortalParams, CheckParams } from "../../libraries/react/client/types/clientGenTypes";
import { attachAction, cancelAction, checkAction, getBillingPortalAction, trackAction } from "../server/genActions";
import { CreateEntityParams, GetEntityParams } from "../../libraries/react/client/types/clientEntTypes";
import { CreateReferralCodeParams } from "../../libraries/react/client/types/clientReferralTypes";

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
}

export class NextAutumnClient extends AutumnClient {
  private readonly encryptedCustomerId?: string;

  constructor({ encryptedCustomerId, customerData }: NextAutumnClientConfig) {
    super({
      customerData,
    });
    this.encryptedCustomerId = encryptedCustomerId;
  }

  // Override createCustomer to use Next.js server actions instead of HTTP requests
  async createCustomer(
    params: Omit<CreateCustomerParams, "id" | "data"> & {
      errorOnNotFound?: boolean;
    }
  ) {
    const res = await createCusAction({
      encryptedCustomerId: this.encryptedCustomerId,
      customerData: this.customerData,
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
  attach = async (params: AttachParams): AutumnPromise<AttachResult> => {
    console.log("Calling attach with params:", params);
    const res = await attachAction({
      encryptedCustomerId: this.encryptedCustomerId,
      customerData: this.customerData,
      ...params,
    });

    console.log("Attach res:", res);

    return res;
  }

  cancel = async (params: CancelParams): AutumnPromise<CancelResult> => {
    return await cancelAction({
      encryptedCustomerId: this.encryptedCustomerId,
      ...params,
    });
  }

  check = async (params: CheckParams): AutumnPromise<CheckResult> => {
    return await checkAction({
      encryptedCustomerId: this.encryptedCustomerId,
      ...params,
    });
  }

  track = async (params: TrackParams): AutumnPromise<TrackResult> => {
    return await trackAction({
      encryptedCustomerId: this.encryptedCustomerId,
      ...params,
    });
  }

  openBillingPortal = async (params?: OpenBillingPortalParams | undefined) => {
    return await getBillingPortalAction({
      encryptedCustomerId: this.encryptedCustomerId,
      ...(params || {}),
    });
  }

  entities = {
    create: async (params: CreateEntityParams | CreateEntityParams[]): AutumnPromise<Entity | Entity[]> => {
      return await createEntityAction({
        encryptedCustomerId: this.encryptedCustomerId,
        entity: params,
      });
    },
    get: async (entityId: string, params?: GetEntityParams): AutumnPromise<Entity> => {
      return await getEntityAction({
        encryptedCustomerId: this.encryptedCustomerId,
        entityId,
        ...params,
      });
    },
    delete: async (entityId: string): AutumnPromise<DeleteEntityResult> => {
      return await deleteEntityAction({
        encryptedCustomerId: this.encryptedCustomerId,
        entityId,
      });
    },
  }

  referrals: any = {
    createCode: async (params: CreateReferralCodeParams) => {
      throw new Error("Not implemented");
    },
    redeemCode: async (params: RedeemReferralCodeParams) => {
      throw new Error("Not implemented");
    },
  }


}
