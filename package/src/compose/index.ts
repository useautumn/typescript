import {
  product,
  priceItem,
  feature,
  featureItem,
  pricedFeatureItem,
} from "./builders/builderFunctions";
import { Feature, Product } from "./models/composeModels";
import { ProductItem } from "./models/productItemModels";

export { product, priceItem, feature, featureItem, pricedFeatureItem };

export type { Feature, Product, ProductItem };
export type Infinity = "infinity";

// CLi types

export type AutumnConfig = {
    products: Product[];
    features: Feature[];
}