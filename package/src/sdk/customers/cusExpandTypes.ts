import type Stripe from "stripe";

export interface CustomerReferral {
  program_id: string;
  customer: {
    id: string;
    name: string | null;
    email: string | null;
  };
  reward_applied: boolean;
  created_at: number;
}

export type CustomerPaymentMethod = Stripe.PaymentMethod;
