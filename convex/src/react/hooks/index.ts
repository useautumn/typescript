import type { FunctionReference } from "convex/server";
import type { 
  TrackArgsType, 
  CheckArgsType, 
  AttachArgsType, 
  CheckoutArgsType,
  CreateEntityArgsType,
  DeleteEntityArgsType,
  GetEntityArgsType,
} from "../../types.js";

// Type for user-facing args (without auth fields)
export type UserTrackArgs = Omit<TrackArgsType, "customerId" | "customerData" | "apiKey">;
export type UserCheckArgs = Omit<CheckArgsType, "customerId" | "customerData" | "apiKey">;
export type UserAttachArgs = Omit<AttachArgsType, "customerId" | "customerData" | "apiKey">;
export type UserCheckoutArgs = Omit<CheckoutArgsType, "customerId" | "customerData" | "apiKey">;
export type UserCreateEntityArgs = Omit<CreateEntityArgsType, "customerId" | "customerData" | "apiKey">;
export type UserDeleteEntityArgs = Omit<DeleteEntityArgsType, "customerId" | "customerData" | "apiKey">;
export type UserGetEntityArgs = Omit<GetEntityArgsType, "customerId" | "customerData" | "apiKey">;

export interface AutumnAPI {
  customer: FunctionReference<"action", "public", {}, any>;
  track: FunctionReference<"action", "public", TrackArgsType, any>;
  check: FunctionReference<"action", "public", CheckArgsType, any>;
  attach: FunctionReference<"action", "public", AttachArgsType, any>;
  checkout: FunctionReference<"action", "public", CheckoutArgsType, any>;
  createEntity: FunctionReference<"action", "public", CreateEntityArgsType, any>;
  deleteEntity: FunctionReference<"action", "public", DeleteEntityArgsType, any>;
  getEntity: FunctionReference<"action", "public", GetEntityArgsType, any>;
}