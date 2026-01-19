import { z } from "zod/v4";

export const CreateReferralCodeParamsSchema = z.object({
  programId: z.string()
});

export type CreateReferralCodeParams = z.infer<typeof CreateReferralCodeParamsSchema>;

export const RedeemReferralCodeParamsSchema = z.object({
  code: z.string()
});

export type RedeemReferralCodeParams = z.infer<typeof RedeemReferralCodeParamsSchema>;
