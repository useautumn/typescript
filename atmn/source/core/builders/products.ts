import {ProductItem, Product, Feature} from '../../compose/index.js';
import {idToVar, notNullish, nullish} from '../utils.js';

const ItemBuilders = {
	priced_feature: pricedFeatureItemBuilder,
	feature: featureItemBuilder,
	price: priceItemBuilder,
};

export function importBuilder() {
	return `
import {
	feature,
	product,
	featureItem,
	pricedFeatureItem,
	priceItem,
} from 'atmn';
    `;
}

export function exportBuilder(productIds: string[], featureIds: string[]) {
	const snippet = `
const autumnConfig = {
    products: [${productIds.map(id => `${idToVar({id, prefix: 'product'})}`).join(', ')}],
    features: [${featureIds.map(id => `${idToVar({id, prefix: 'feature'})}`).join(', ')}]
}

export default autumnConfig;
    `;
	return snippet;
}

export function productBuilder({
	product,
	features,
}: {
	product: Product;
	features: Feature[];
}) {
	// if (product.id == 'top_up') {
	// 	console.log(
	// 		'Items:',
	// 		product.items.map(item => item.tiers),
	// 	);
	// }
	const snippet = `
export const ${idToVar({id: product.id, prefix: 'product'})} = product({
    id: '${product.id}',
    name: '${product.name}',
    items: [${product.items
			.map(
				(item: ProductItem) =>
					`${ItemBuilders[item.type as keyof typeof ItemBuilders]({
						item,
						features,
					})}`,
			)
			.join('           ')}     ]
})
`;
	return snippet;
}

// Item Builders

const getItemFieldPrefix = () => {
	return `\n            `;
};
const getResetUsageStr = ({
	item,
	features,
}: {
	item: ProductItem;
	features: Feature[];
}) => {
	if (!item.feature_id) return '';
	const feature = features.find(f => f.id === item.feature_id)!;
	if (feature.type == 'boolean' || feature.type == 'credit_system') return '';

	const defaultResetUsage = feature.type === 'single_use' ? true : false;

	if (
		notNullish(item.reset_usage_when_enabled) &&
		item.reset_usage_when_enabled !== defaultResetUsage
	) {
		return `${getItemFieldPrefix()}reset_usage_when_enabled: ${
			item.reset_usage_when_enabled
		},`;
	}

	return '';
};

const getIntervalStr = ({item}: {item: ProductItem}) => {
	if (item.interval == null) return ``;
	return `${getItemFieldPrefix()}interval: '${item.interval}',`;
};

const getEntityFeatureIdStr = ({item}: {item: ProductItem}) => {
	if (nullish(item.entity_feature_id)) return '';
	return `${getItemFieldPrefix()}entity_feature_id: ${idToVar({
		id: item.entity_feature_id!,
		prefix: 'feature',
	})}.id,`;
};

const getPriceStr = ({item}: {item: ProductItem}) => {
	// 1. If tiers...
	if (item.tiers) {
		return `
		tiers: [
			${item.tiers
				.map(
					tier =>
						`{ to: ${tier.to == 'inf' ? "'inf'" : tier.to}, amount: ${
							tier.amount
						} }`,
				)
				.join(',\n\t\t\t')}
		],`;
	}

	if (item.price == null) return '';
	return `price: ${item.price},`;
	// if (item.price == null) return '';
	// return `${getItemFieldPrefix()}price: ${item.price},`;
};

export function pricedFeatureItemBuilder({
	item,
	features,
}: {
	item: ProductItem;
	features: Feature[];
}) {
	const intervalStr = getIntervalStr({item});
	const entityFeatureIdStr = getEntityFeatureIdStr({item});
	const resetUsageStr = getResetUsageStr({item, features});
	const priceStr = getPriceStr({item});
	const snippet = `
        pricedFeatureItem({
            feature_id: ${idToVar({id: item.feature_id!, prefix: 'feature'})}.id,
            ${priceStr}${intervalStr}
            included_usage: ${
							item.included_usage == 'inf' ? `"inf"` : item.included_usage
						},
            billing_units: ${item.billing_units},
            usage_model: '${
							item.usage_model
						}',${resetUsageStr}${entityFeatureIdStr}
        }),
`;
	return snippet;
}

export function featureItemBuilder({
	item,
	features,
}: {
	item: ProductItem;
	features: Feature[];
}) {
	const entityFeatureIdStr = getEntityFeatureIdStr({item});
	const intervalStr = getIntervalStr({item});
	const resetUsageStr = getResetUsageStr({item, features});
	const snippet = `
        featureItem({
            feature_id: ${idToVar({id: item.feature_id!, prefix: 'feature'})}.id,
            included_usage: ${
							item.included_usage == 'inf' ? `"inf"` : item.included_usage
						},${intervalStr}${resetUsageStr}${entityFeatureIdStr}
        }),
`;
	return snippet;
}

export function priceItemBuilder({item}: {item: ProductItem}) {
	const intervalStr = getIntervalStr({item});
	const snippet = `
        priceItem({
            price: ${item.price},${intervalStr}
        }),
`;
	return snippet;
}
