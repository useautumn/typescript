import { ProductItem } from "../../../../sdk";

export interface ProductDetails {
  id: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  recommendText?: string;
  everythingFrom?: string;

  price?: {
    primaryText: string;
    secondaryText?: string;
  };

  items: {
    featureId?: string;
    primaryText: string;
    secondaryText?: string;
  }[];
}

// export interface PricingTableProduct {
//   id: string;
//   name: string;
//   buttonText: string;

//   price: {
//     primaryText: string;
//     secondaryText?: string;
//   };

//   items: ({
//     featureId?: string;
//     primaryText: string;
//     secondaryText?: string;
//   } & ProductItem)[];
// }
