import { ProductScenario } from "@sdk/general/checkTypes";
import { ProductItem } from "../products/prodTypes";

export interface GetPricingTableParams {
  customer_id?: string;
}

export interface PricingTableProduct {
  id: string;
  name: string;
  description?: string;
  button_text?: string;
  recommend_text?: string;
  everything_from?: string;

  price: {
    primary_text: string;
    secondary_text?: string;
  } & ProductItem;

  items: ({
    primary_text: string;
    secondary_text?: string;
  } & ProductItem)[];

  scenario: ProductScenario;
}
