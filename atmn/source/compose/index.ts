import {
	feature,
	featureItem,
	pricedFeatureItem,
	priceItem,
	product,
} from "./builders/builderFunctions.js";
import type { Feature, Product } from "./models/composeModels.js";
import type { ProductItem } from "./models/productItemModels.js";

export { product, priceItem, feature, featureItem, pricedFeatureItem };

export type { Feature, Product, ProductItem };
export type Infinity = "infinity";

// CLi types

export type AutumnConfig = {
	products: Product[];
	features: Feature[];
};
