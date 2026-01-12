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
 * Maps SDK field names to API field names (e.g., 'included' -> 'granted_balance')
 */
function transformPlanForApi(plan: Plan): Record<string, unknown> {
	const transformed = { ...plan } as Record<string, unknown>;

	// Transform features array: 'included' -> 'granted_balance'
	if (plan.features && Array.isArray(plan.features)) {
		transformed.features = plan.features.map(feature => {
			const transformedFeature = { ...feature } as Record<string, unknown>;
			if ('included' in feature && feature.included !== undefined) {
				transformedFeature.granted_balance = feature.included;
				delete transformedFeature.included;
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

		// If local plan has no group but upstream has one, explicitly unset it
		if (!plan.group && curPlan.group) {
			updatePayload['group'] = null;
		}

		// If local plan has undefined is_add_on but upstream is true, explicitly set to false
		if (plan.add_on === undefined && curPlan.add_on === true) {
			updatePayload['add_on'] = false;
		}

		// If local plan has undefined is_default but upstream is true, explicitly set to false
		if (plan.default === undefined && curPlan.default === true) {
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
