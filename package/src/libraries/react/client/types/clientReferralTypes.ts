import { z } from "zod";

export const CreateReferralCodeParamsSchema = z.object({
  programId: z.string()
});

export type CreateReferralCodeParams = z.infer<typeof CreateReferralCodeParamsSchema>;

export const RedeemReferralCodeParamsSchema = z.object({
  code: z.string()
});

export type RedeemReferralCodeParams = z.infer<typeof RedeemReferralCodeParamsSchema>;
