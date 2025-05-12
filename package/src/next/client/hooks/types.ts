import React from "react";

export interface AttachParams {
  productId: string;
  entityId?: string;
  options?: {
    featureId: string;
    quantity: number;
  }[];
  successUrl?: string;
  forceCheckout?: boolean;
  metadata?: Record<string, string>;
  dialog?: () => JSX.Element | React.ReactNode;

  callback?: () => Promise<void>;
  withPreview?: "formatted" | "raw";
}

export interface CreateEntityParams {
  id: string;
  name: string;
  featureId: string;
}
