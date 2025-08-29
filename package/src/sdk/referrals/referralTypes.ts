import { z } from "zod/v4";

export const CreateReferralCodeParamsSchema = z.object({
  customer_id: z.string(),
  program_id: z.string(),
});

export type CreateReferralCodeParams = z.infer<
  typeof CreateReferralCodeParamsSchema
>;

export interface CreateReferralCodeResult {
  code: string;
  customer_id: string;
  created_at: number;
}

export const RedeemReferralCodeParamsSchema = z.object({
  code: z.string(),
  customer_id: z.string(),
});

export type RedeemReferralCodeParams = z.infer<
  typeof RedeemReferralCodeParamsSchema
>;

export interface RedeemReferralCodeResult {
  id: string;
  customer_id: string;
  reward_id: string;
}
