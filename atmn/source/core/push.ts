// @ts-nocheck
import type { Spinner } from 'yocto-spinner';
import type { Feature, Plan } from '../compose/index.js';
import { externalRequest } from './api.js';
import { getAllPlans, getFeatures } from './pull.js';

export async function checkForDeletables(
	currentFeatures: Feature[],
	currentPlans: Plan[],
) {
	const features = await getFeatures({ includeArchived: true }); // Get from AUTUMN

	const featureIds = features.map((feature: Feature) => feature.id);
	const currentFeatureIds = currentFeatures.map(feature => feature.id);
	const featuresToDelete = featureIds.filter(
		(featureId: string) =>
			!currentFeatureIds.includes(featureId) &&
			!features.some(
				(feature: Feature) => feature.id === featureId && feature.archived,
			),
	);

	const plans = await getAllPlans();
	const planIds = plans.map((plan: Plan) => plan.id);
	const currentPlanIds = currentPlans.map(
		(plan: Plan) => plan.id,
	);
	const plansToDelete = planIds.filter(
		(planId: string) => !currentPlanIds.includes(planId),
	);

	return {
		allFeatures: features,
		curFeatures: features.filter((feature: Feature) => !feature.archived),
		curPlans: plans,
		featuresToDelete,
		plansToDelete,
	};
}

const isDuplicate = (error: any) => {
	return (
		error.response &&
		error.response.data &&
		(error.response.data.code === 'duplicate_feature_id' ||
			error.response.data.code === 'product_already_exists')
	);
};

export async function upsertFeature(feature: Feature, s: Spinner) {
	// const s = initSpinner(`Pushing feature [${feature.id}]`);
	try {
		const response = await externalRequest({
			method: 'POST',
			path: `/features`,
			data: feature,
			throwOnError: true,
		});

		return response.data;
	} catch (error: any) {
		if (isDuplicate(error)) {
			const response = await externalRequest({
				method: 'POST',
				path: `/features/${feature.id}`,
				data: feature,
			});
			return response.data;
		}

		console.error(
			`\nFailed to push feature ${feature.id}: ${error.response?.data?.message || 'Unknown error'
			}`,
		);
		process.exit(1);
	} finally {
		// s.info(`Pushed feature [${feature.id}]`);
		s.text = `Pushed feature [${feature.id}]`;
		// s.success(`Pushed feature [${feature.id}]`);
		// console.log(`Pushed feature [${feature.id}]`);
	}
}

export async function checkPlanForConfirmation({
	curPlans,
	plan,
}: {
	curPlans: Plan[];
	plan: Plan;
}) {
	const curPlan = curPlans.find(p => p.id === plan.id);
	if (!curPlan) {
		return {
			id: plan.id,
			will_version: false,
		};
	}

	const res1 = await externalRequest({
		method: 'GET',
		path: `/products/${plan.id}/has_customers`,
		data: plan,
	});

	return {
		id: plan.id,
		will_version: res1.will_version,
		archived: res1.archived,
	};
}

/**
 * Transform plan data for API submission.
 * Maps SDK field names to API field names:
 * - 'auto_enable' -> 'default'
 * - 'included' -> 'granted_balance'
 * - 'billing_method' -> 'usage_model'
 * - Flattened interval/interval_count/carry_over_usage -> nested reset object
 */
function transformPlanForApi(plan: Plan): Record<string, unknown> {
	const transformed = { ...plan } as Record<string, unknown>;

	// 'auto_enable' -> 'default'
	if ('auto_enable' in plan) {
		transformed.default = plan.auto_enable;
		delete transformed.auto_enable;
	}

	// Transform features array
	if (plan.features && Array.isArray(plan.features)) {
		transformed.features = plan.features.map(feature => {
			const transformedFeature = { ...feature } as Record<string, unknown>;

			// 'included' -> 'granted_balance'
			if ('included' in feature && feature.included !== undefined) {
				transformedFeature.granted_balance = feature.included;
				delete transformedFeature.included;
			}

			// Transform flattened reset fields to nested reset object
			// SDK: interval, interval_count, carry_over_usage -> API: reset.interval, reset.interval_count, reset.reset_when_enabled
			const featureAny = feature as Record<string, unknown>;
			if ('interval' in featureAny || 'interval_count' in featureAny || 'carry_over_usage' in featureAny) {
				const reset: Record<string, unknown> = {};

				if ('interval' in featureAny && featureAny.interval !== undefined) {
					reset.interval = featureAny.interval;
					delete transformedFeature.interval;
				}

				if ('interval_count' in featureAny && featureAny.interval_count !== undefined) {
					reset.interval_count = featureAny.interval_count;
					delete transformedFeature.interval_count;
				}

				// SDK: carry_over_usage (true = keep existing) -> API: reset_when_enabled (true = reset on enable)
				// They are inverted
				if ('carry_over_usage' in featureAny && featureAny.carry_over_usage !== undefined) {
					reset.reset_when_enabled = !featureAny.carry_over_usage;
					delete transformedFeature.carry_over_usage;
				}

				if (Object.keys(reset).length > 0) {
					transformedFeature.reset = reset;
				}
			}

			// Transform nested price object: 'billing_method' -> 'usage_model'
			// Also add interval/interval_count to price from reset if price exists
			if ('price' in feature && feature.price && typeof feature.price === 'object') {
				const price = feature.price as Record<string, unknown>;
				const transformedPrice = { ...price };

				if ('billing_method' in price) {
					transformedPrice.usage_model = price.billing_method;
					delete transformedPrice.billing_method;
				}

				// If we have a reset interval and a price, copy interval to price for API
				const resetObj = transformedFeature.reset as Record<string, unknown> | undefined;
				if (resetObj?.interval) {
					transformedPrice.interval = resetObj.interval;
					if (resetObj.interval_count) {
						transformedPrice.interval_count = resetObj.interval_count;
					}
				}

				transformedFeature.price = transformedPrice;
			}

			return transformedFeature;
		});
	}

	return transformed;
}

export async function upsertPlan({
	curPlans,
	plan,
	spinner,
	shouldUpdate = true,
}: {
	curPlans: Plan[];
	plan: Plan;
	spinner: Spinner;
	shouldUpdate?: boolean;
}) {
	if (!shouldUpdate) {
		spinner.text = `Skipping update to plan ${plan.id}`;
		return {
			id: plan.id,
			action: 'skipped',
		};
	}

	const curPlan = curPlans.find(p => p.id === plan.id);

	// Transform SDK field names to API field names
	const apiPlan = transformPlanForApi(plan);

	if (!curPlan) {
		await externalRequest({
			method: 'POST',
			path: `/products`,
			data: apiPlan,
		});
		spinner.text = `Created plan [${plan.id}]`;
		return {
			id: plan.id,
			action: 'create',
		};
	} else {
		// Prepare the update payload
		const updatePayload = { ...apiPlan };

		// Handle swapNullish for group field:
		// - If local is undefined AND upstream has a group → send null (user wants to unset)
		// - If local is null AND upstream has a group → send null (user wants to unset)
		// - If local has a value AND upstream is different → send the new value (already in apiPlan)
		// - If local is undefined AND upstream is undefined → do nothing
		if (plan.group === undefined && curPlan.group !== undefined && curPlan.group !== null) {
			updatePayload['group'] = null;
		} else if (plan.group === null && curPlan.group !== undefined && curPlan.group !== null) {
			updatePayload['group'] = null;
		}

		// Handle swapFalse for add_on field:
		// - If local is undefined AND upstream is true → send false (user wants to unset)
		// - If local is true or false → send that value (already in apiPlan)
		// - If local is undefined AND upstream is false/undefined → do nothing
		if (plan.add_on === undefined && curPlan.add_on === true) {
			updatePayload['add_on'] = false;
		}

		// Handle swapFalse for auto_enable (maps to 'default' in API):
		// - If local is undefined AND upstream is true → send false (user wants to unset)
		// - If local is true or false → send that value (already in apiPlan as 'default')
		// - If local is undefined AND upstream is false/undefined → do nothing
		if (plan.auto_enable === undefined && curPlan.default === true) {
			updatePayload['default'] = false;
		}

		await externalRequest({
			method: 'POST',
			path: `/products/${plan.id}`,
			data: updatePayload,
		});

		spinner.text = `Updated plan [${plan.id}]`;
		return {
			id: plan.id,
			action: 'updated',
		};
	}
	// try {
	// 	const response = await externalRequest({
	// 		method: 'POST',
	// 		path: `/products`,
	// 		data: product,
	// 		throwOnError: true,
	// 	});
	// 	spinner.success(`Pushed product [${product.id}]`);
	// } catch (error: any) {
	// 	if (isDuplicate(error)) {
	// 		const res1 = await externalRequest({
	// 			method: 'GET',
	// 			path: `/products/${product.id}/has_customers`,
	// 			data: product,
	// 		});

	// 		const {current_version, will_version} = res1;

	// 		let shouldUpdate = true;
	// 		if (will_version) {
	// 			spinner.stop();
	// 			// Clear the line to remove any spinner artifacts
	// 			process.stdout.write('\r\x1b[K');
	// 			shouldUpdate = await confirm({
	// 				message: `Product ${product.id} has customers on it and updating it will create a new version.\nAre you sure you'd like to continue? `,
	// 			});
	// 		}

	// 		if (shouldUpdate) {
	// 			// If the first request fails, try posting to the specific product ID endpoint
	// 			spinner.start();
	// 			const response = await externalRequest({
	// 				method: 'POST',
	// 				path: `/products/${product.id}`,
	// 				data: product,
	// 			});

	// 			spinner.success(`Pushed product [${product.id}]`);
	// 			return response;
	// 		} else {
	// 			spinner.info(`Skipping update to product ${product.id}`);
	// 			return;
	// 		}
	// 	}

	// 	console.error(
	// 		`\nFailed to push product ${product.id}: ${
	// 			error.response?.data?.message || 'Unknown error'
	// 		}`,
	// 	);
	// 	process.exit(1);
	// }
}
