import { type Plan } from "@/types";

import type React from "react";

// Extended Plan type with display properties added by usePricingTable hook
type PricingTablePlan = Plan & {
  display?: {
    name?: string;
    description?: string;
    button_text?: string;
    recommend_text?: string;
    everything_from?: string;
    button_url?: string;
  };
  properties?: {
    is_free?: boolean;
    is_one_off?: boolean;
    has_trial?: boolean;
    interval_group?: string;
    updateable?: boolean;
  };
};

export const getPricingTableContent = (product: PricingTablePlan): { buttonText: React.JSX.Element } => {
  const { customer_eligibility, free_trial, properties } = product;
  const scenario = customer_eligibility?.scenario;
  const { is_one_off, updateable, has_trial } = properties ?? {};

  if (has_trial) {
    return {
      buttonText: <p>Start Free Trial</p>,
    };
  }

  switch (scenario) {
    case "scheduled":
      return {
        buttonText: <p>Plan Scheduled</p>,
      };

    case "active":
      if (updateable) {
        return {
          buttonText: <p>Update Plan</p>,
        };
      }

      return {
        buttonText: <p>Current Plan</p>,
      };

    case "new":
      if (is_one_off) {
        return {
          buttonText: <p>Purchase</p>,
        };
      }

      return {
        buttonText: <p>Get started</p>,
      };

    case "renew":
      return {
        buttonText: <p>Renew</p>,
      };

    case "upgrade":
      return {
        buttonText: <p>Upgrade</p>,
      };

    case "downgrade":
      return {
        buttonText: <p>Downgrade</p>,
      };

    case "cancel":
      return {
        buttonText: <p>Cancel Plan</p>,
      };

    default:
      return {
        buttonText: <p>Get Started</p>,
      };
  }
};
