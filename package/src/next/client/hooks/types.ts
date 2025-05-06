export interface AttachParams {
  dialog?: boolean;
  productId: string;
  options?: {
    featureId: string;
    quantity: number;
  }[];
  successUrl?: string;
  forceCheckout?: boolean;
  metadata?: Record<string, string>;
  callback?: () => Promise<void>;
  withPreview?: "formatted" | "raw";
}
