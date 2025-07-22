import {Product, Feature} from '../models/composeModels.js';

import {
	ProductItem,
	ProductItemInterval,
	UsageModel,
} from '../models/productItemModels.js';

export const product = (p: Product) => p;
export const feature = (f: Feature) => f;

export const featureItem = ({
	feature_id,
	included_usage,
	interval,
	reset_usage_when_enabled = false,
	entity_feature_id,
}: {
	feature_id: string;
	included_usage?: number;
	interval?: ProductItemInterval;
	reset_usage_when_enabled?: boolean;
	entity_feature_id?: string;
}): ProductItem => {
	return {
		included_usage,
		feature_id,
		interval,
		reset_usage_when_enabled,
		entity_feature_id,
	};
};

export const pricedFeatureItem = ({
	feature_id,
	price,
	interval,
	included_usage = undefined,
	billing_units = 1,
	usage_model = 'pay_per_use',
	reset_usage_when_enabled,
	entity_feature_id,
}: {
	feature_id: string;
	price: number;
	interval?: ProductItemInterval;
	included_usage?: number;
	billing_units?: number;
	usage_model?: UsageModel;
	reset_usage_when_enabled?: boolean;
	entity_feature_id?: string;
}): ProductItem => {
	return {
		price,
		interval,
		billing_units,
		feature_id,
		usage_model,
		included_usage,
		reset_usage_when_enabled,
		entity_feature_id,
	};
};

export const priceItem = ({
	price,
	interval,
}: {
	price: number;
	interval?: ProductItemInterval;
}): ProductItem => {
	return {
		price,
		interval,
	};
};
