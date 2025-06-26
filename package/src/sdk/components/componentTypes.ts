import { CheckProductScenario } from "@sdk/general/checkTypes";
import { FreeTrial, ProductItem } from "@sdk/products/prodTypes";

export interface GetPricingTableParams {
  customer_id?: string;
}

export interface PricingTableProduct {
  id: string;
  name: string;
  scenario: CheckProductScenario
  is_add_on: boolean;
  free_trial: FreeTrial | null;
  button_text: string;
  
  price: {
    primary_text: string;
    secondary_text?: string;
  } & ProductItem;

  items: ({
    primary_text: string;
    secondary_text?: string;
  } & ProductItem)[];
}

// export interface PricecnClientProduct {
//   id: string;
//   description?: string;
//   buttonText?: string;
//   recommendText?: string;
//   onClick?: any;
//   href?: string;
// }
