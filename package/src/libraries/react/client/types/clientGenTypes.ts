import { EntityDataParams } from "./clientEntTypes";

// Attach
export interface AttachFeatureOptions {
  featureId: string;
  quantity: number;
}

export interface AttachParams {
  productId?: string;
  entityId?: string;
  options?: AttachFeatureOptions[];
  productIds?: string[];
  freeTrial?: boolean;
  successUrl?: string;
  metadata?: Record<string, string>;
  forceCheckout?: boolean;
  dialog?: (data: any) => JSX.Element | React.ReactNode;
  entityData?: EntityDataParams;
  openInNewTab?: boolean;
  reward?: string;
}

export interface CancelParams {
  productId: string;
  entityId?: string;
  cancelImmediately?: boolean;
}

// Add interfaces for function params
export interface CheckParams {
  featureId?: string;
  productId?: string;
  entityId?: string;
  requiredBalance?: number;
  sendEvent?: boolean;
  withPreview?: boolean;
  dialog?: (data: any) => JSX.Element | React.ReactNode;
  entityData?: EntityDataParams;
}

export interface TrackParams {
  featureId?: string;
  eventName?: string;
  entityId?: string;
  value?: number;
  idempotencyKey?: string;
  entityData?: EntityDataParams;
}

export interface OpenBillingPortalParams {
  returnUrl?: string;
}
