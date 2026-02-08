// @ts-nocheck - Using ts-nocheck due to complex Record<string, unknown> index signature issues
import type { Feature, Plan, PlanFeature } from "../../compose/models/index.js";
import {
	archiveFeature as archiveFeatureApi,
	archivePlan as archivePlanApi,
	createPlan,
	deleteFeature as deleteFeatureApi,
	deletePlan as deletePlanApi,
	fetchFeatures,
	fetchPlans,
	getFeatureDeletionInfo,
	getPlanDeletionInfo,
	getPlanHasCustomers,
	unarchiveFeature as unarchiveFeatureApi,
	unarchivePlan as unarchivePlanApi,
	updateFeature,
	updatePlan,
	upsertFeature,
} from "../../lib/api/endpoints/index.js";
import { isProd } from "../../lib/env/cliContext.js";
import { AppEnv, getKey } from "../../lib/env/index.js";
import {
	transformApiFeature,
	transformApiPlan,
} from "../../lib/transforms/apiToSdk/index.js";
import { transformPlanToApi } from "../../lib/transforms/sdkToApi/index.js";
import type {
	FeatureDeleteInfo,
	PlanDeleteInfo,
	PlanUpdateInfo,
	PushAnalysis,
	RemoteData,
} from "./types.js";

/**
 * Get the secret key for the current environment
 */
function getSecretKey(): string {
	const environment = isProd() ? AppEnv.Live : AppEnv.Sandbox;
	return getKey(environment);
}

/**
 * Core push logic - pure functions with no UI/prompts
 * All functions throw on error for proper React error handling
 */

// Fetch all features and plans from remote
export async function fetchRemoteData(): Promise<RemoteData> {
	const secretKey = getSecretKey();

	const [features, plans] = await Promise.all([
		fetchFeatures({ secretKey, includeArchived: true }),
		fetchPlans({ secretKey, includeArchived: true }),
	]);

	return {
		features: features as Feature[],
		plans: plans as Plan[],
	};
}

// Check if a feature can be deleted
async function checkFeatureDeleteInfo(
	featureId: string,
	localFeatures: Feature[],
	remoteFeatures: Feature[],
): Promise<FeatureDeleteInfo> {
	const secretKey = getSecretKey();

	// Get the feature type from remote for sorting purposes
	const remoteFeature = remoteFeatures.find((f) => f.id === featureId);
	const featureType = remoteFeature?.type as
		| "boolean"
		| "metered"
		| "credit_system"
		| undefined;

	// Check locally if this feature is referenced by any credit system in the config
	const referencingCreditSystems = localFeatures.filter(
		(f) =>
			f.type === "credit_system" &&
			f.credit_schema?.some((cs) => cs.metered_feature_id === featureId),
	);

	if (referencingCreditSystems.length >= 1) {
		return {
			id: featureId,
			canDelete: false,
			reason: "credit_system",
			referencingCreditSystems: referencingCreditSystems.map((f) => f.id),
			featureType,
		};
	}

	// Check API for product references
	const response = await getFeatureDeletionInfo({ secretKey, featureId });

	if (response && response.totalCount > 0) {
		return {
			id: featureId,
			canDelete: false,
			reason: "products",
			referencingProducts: {
				name: response.productName || "Unknown Product",
				count: response.totalCount,
			},
			featureType,
		};
	}

	return {
		id: featureId,
		canDelete: true,
		featureType,
	};
}

// Check if a plan can be deleted
async function checkPlanDeleteInfo(planId: string): Promise<PlanDeleteInfo> {
	const secretKey = getSecretKey();
	const response = await getPlanDeletionInfo({ secretKey, planId });

	if (response && response.totalCount > 0) {
		return {
			id: planId,
			canDelete: false,
			customerCount: response.totalCount,
			firstCustomerName: response.customerName,
		};
	}

	return {
		id: planId,
		canDelete: true,
		customerCount: 0,
	};
}

// Check if updating a plan will create a new version
async function checkPlanForVersioning(
	plan: Plan,
	remotePlans: Plan[],
): Promise<PlanUpdateInfo> {
	const secretKey = getSecretKey();
	const remotePlan = remotePlans.find((p) => p.id === plan.id);

	if (!remotePlan) {
		return {
			plan,
			willVersion: false,
			isArchived: false,
		};
	}

	try {
		// Transform SDK plan to API format for comparison
		const apiPlan = transformPlanToApi(plan);
		const response = await getPlanHasCustomers({
			secretKey,
			planId: plan.id,
			plan: apiPlan,
		});

		return {
			plan,
			willVersion: response.will_version || false,
			isArchived: response.archived || false,
		};
	} catch {
		// If the API can't validate the plan (e.g., it references a feature
		// that hasn't been created yet), skip the versioning check.
		// Features are always pushed before plans, so this resolves itself.
		return {
			plan,
			willVersion: false,
			isArchived: false,
		};
	}
}

/**
 * Deep equality check that treats null and undefined as equivalent.
 */
function valuesEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a == null && b == null) return true;
	if (a == null || b == null) return false;
	if (typeof a !== typeof b) return false;

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((item, i) => valuesEqual(item, b[i]));
	}

	if (typeof a === "object" && typeof b === "object") {
		const aObj = a as Record<string, unknown>;
		const bObj = b as Record<string, unknown>;
		const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);
		for (const key of allKeys) {
			if (!valuesEqual(aObj[key], bObj[key])) return false;
		}
		return true;
	}

	return false;
}

/**
 * Normalize a feature to a canonical form for comparison.
 * Strips default/empty values so semantically identical features
 * produce the same representation.
 */
function normalizeFeatureForCompare(f: Feature): Record<string, unknown> {
	const result: Record<string, unknown> = {
		id: f.id,
		name: f.name,
		type: f.type,
	};

	// consumable is only meaningful for metered features.
	// For credit_system it's always true (the only valid value), so omit it.
	if (f.type === "metered" && "consumable" in f) {
		result.consumable = (f as { consumable: boolean }).consumable;
	}

	if (f.event_names && f.event_names.length > 0) {
		result.event_names = [...f.event_names].sort();
	}

	if (f.credit_schema && f.credit_schema.length > 0) {
		result.credit_schema = [...f.credit_schema]
			.sort((a, b) =>
				a.metered_feature_id.localeCompare(b.metered_feature_id),
			)
			.map((cs) => ({
				metered_feature_id: cs.metered_feature_id,
				credit_cost: cs.credit_cost,
			}));
	}

	return result;
}

/**
 * Normalize a plan feature to a canonical form for comparison.
 * Strips default values (unlimited: false, billing_units: 1, interval_count: 1).
 */
function normalizePlanFeatureForCompare(
	pf: PlanFeature,
): Record<string, unknown> {
	const f = pf as Record<string, unknown>;
	const result: Record<string, unknown> = {
		feature_id: pf.feature_id,
	};

	if (f.included != null) result.included = f.included;
	if (f.unlimited === true) result.unlimited = true;

	const reset = f.reset as Record<string, unknown> | undefined;
	if (reset != null) {
		const r: Record<string, unknown> = { interval: reset.interval };
		if (reset.interval_count != null && reset.interval_count !== 1) {
			r.interval_count = reset.interval_count;
		}
		result.reset = r;
	}

	const price = f.price as Record<string, unknown> | undefined;
	if (price != null) {
		const p: Record<string, unknown> = {};
		if (price.amount != null) p.amount = price.amount;
		if (price.billing_method != null)
			p.billing_method = price.billing_method;
		if (price.interval != null) p.interval = price.interval;
		if (price.interval_count != null && price.interval_count !== 1) {
			p.interval_count = price.interval_count;
		}
		if (
			price.tiers != null &&
			Array.isArray(price.tiers) &&
			price.tiers.length > 0
		) {
			p.tiers = price.tiers;
		}
		if (price.billing_units != null && price.billing_units !== 1) {
			p.billing_units = price.billing_units;
		}
		if (price.max_purchase != null) p.max_purchase = price.max_purchase;
		if (Object.keys(p).length > 0) result.price = p;
	}

	const proration = f.proration as Record<string, unknown> | undefined;
	if (proration != null) result.proration = proration;

	const rollover = f.rollover as Record<string, unknown> | undefined;
	if (rollover != null) result.rollover = rollover;

	return result;
}

/**
 * Normalize a plan to a canonical form for comparison.
 * Strips default/empty values so semantically identical plans
 * produce the same representation.
 */
function normalizePlanForCompare(plan: Plan): Record<string, unknown> {
	const result: Record<string, unknown> = {
		id: plan.id,
		name: plan.name,
	};

	if (plan.description != null && plan.description !== "") {
		result.description = plan.description;
	}
	if (plan.group != null && plan.group !== "") {
		result.group = plan.group;
	}
	if (plan.add_on === true) result.add_on = true;
	if (plan.auto_enable === true) result.auto_enable = true;

	if (plan.price != null) {
		result.price = {
			amount: plan.price.amount,
			interval: plan.price.interval,
		};
	}

	if (plan.free_trial != null) {
		result.free_trial = {
			duration_type: plan.free_trial.duration_type,
			duration_length: plan.free_trial.duration_length,
			card_required: plan.free_trial.card_required,
		};
	}

	if (plan.features != null && plan.features.length > 0) {
		result.features = [...plan.features]
			.sort((a, b) => a.feature_id.localeCompare(b.feature_id))
			.map(normalizePlanFeatureForCompare);
	}

	return result;
}

/**
 * Check if a local feature differs from its remote counterpart.
 * Transforms the remote API data to SDK format before comparing.
 */
function hasFeatureChanged(local: Feature, remoteRaw: unknown): boolean {
	const remote = transformApiFeature(remoteRaw);
	return !valuesEqual(
		normalizeFeatureForCompare(local),
		normalizeFeatureForCompare(remote),
	);
}

/**
 * Check if a local plan differs from its remote counterpart.
 * Transforms the remote API data to SDK format before comparing.
 */
function hasPlanChanged(local: Plan, remoteRaw: unknown): boolean {
	const remote = transformApiPlan(remoteRaw as any);
	return !valuesEqual(
		normalizePlanForCompare(local),
		normalizePlanForCompare(remote),
	);
}

/**
 * Analyze what changes need to be pushed
 */
export async function analyzePush(
	localFeatures: Feature[],
	localPlans: Plan[],
): Promise<PushAnalysis> {
	const remoteData = await fetchRemoteData();

	const localFeatureIds = new Set(localFeatures.map((f) => f.id));
	const localPlanIds = new Set(localPlans.map((p) => p.id));
	const remoteFeatureIds = new Set(remoteData.features.map((f) => f.id));
	const remotePlanIds = new Set(remoteData.plans.map((p) => p.id));

	// Find features to create and update (only actually changed features)
	const featuresToCreate = localFeatures.filter(
		(f) => !remoteFeatureIds.has(f.id),
	);
	const featuresToUpdate = localFeatures.filter((f) => {
		if (!remoteFeatureIds.has(f.id)) return false;
		const remoteFeature = remoteData.features.find((rf) => rf.id === f.id);
		if (!remoteFeature) return false;
		return hasFeatureChanged(f, remoteFeature);
	});

	// Find features that exist remotely but not locally (potential deletes)
	// Exclude already archived features
	const featureIdsToDelete = remoteData.features
		.filter(
			(f) =>
				!localFeatureIds.has(f.id) &&
				!(f as Feature & { archived?: boolean }).archived,
		)
		.map((f) => f.id);

	// Check deletion info for each feature
	const featureDeletePromises = featureIdsToDelete.map((id) =>
		checkFeatureDeleteInfo(id, localFeatures, remoteData.features),
	);
	const featuresToDeleteUnsorted = await Promise.all(featureDeletePromises);

	// Sort features to delete: credit systems first to prevent dependency issues
	const featuresToDelete = featuresToDeleteUnsorted.sort((a, b) => {
		if (
			a.featureType === "credit_system" &&
			b.featureType !== "credit_system"
		) {
			return -1;
		}
		if (
			a.featureType !== "credit_system" &&
			b.featureType === "credit_system"
		) {
			return 1;
		}
		return 0;
	});

	// Find archived features in local config
	const archivedFeatures = localFeatures.filter((f) => {
		const remote = remoteData.features.find((rf) => rf.id === f.id);
		return remote && (remote as Feature & { archived?: boolean }).archived;
	});

	// Find plans to create and update (only actually changed plans)
	const plansToCreate = localPlans.filter((p) => !remotePlanIds.has(p.id));
	const plansToUpdateLocal = localPlans.filter((p) => {
		if (!remotePlanIds.has(p.id)) return false;
		const remotePlan = remoteData.plans.find((rp) => rp.id === p.id);
		if (!remotePlan) return false;
		return hasPlanChanged(p, remotePlan);
	});

	// Check versioning info for each plan to update
	const planUpdatePromises = plansToUpdateLocal.map((plan) =>
		checkPlanForVersioning(plan, remoteData.plans),
	);
	const plansToUpdate = await Promise.all(planUpdatePromises);

	// Find plans that exist remotely but not locally (potential deletes)
	const planIdsToDelete = remoteData.plans
		.filter(
			(p) =>
				!localPlanIds.has(p.id) &&
				!(p as Plan & { archived?: boolean }).archived,
		)
		.map((p) => p.id);

	// Check deletion info for each plan
	const planDeletePromises = planIdsToDelete.map((id) =>
		checkPlanDeleteInfo(id),
	);
	const plansToDelete = await Promise.all(planDeletePromises);

	// Find archived plans in local config
	const archivedPlans = localPlans.filter((p) => {
		const remote = remoteData.plans.find((rp) => rp.id === p.id);
		return remote && (remote as Plan & { archived?: boolean }).archived;
	});

	return {
		featuresToCreate,
		featuresToUpdate,
		featuresToDelete,
		plansToCreate,
		plansToUpdate,
		plansToDelete,
		archivedFeatures,
		archivedPlans,
	};
}

/**
 * Transform plan data for API submission.
 * Maps SDK field names to API field names.
 */
function transformPlanForApi(plan: Plan): Record<string, unknown> {
	const transformed = { ...plan } as Record<string, unknown>;

	// 'auto_enable' -> 'default'
	if ("auto_enable" in plan) {
		transformed.default = (
			plan as Plan & { auto_enable?: boolean }
		).auto_enable;
		delete transformed.auto_enable;
	}

	// Transform features array
	if (plan.features && Array.isArray(plan.features)) {
		transformed.features = plan.features.map((feature) => {
			const transformedFeature = { ...feature } as Record<string, unknown>;

			// 'included' -> 'granted_balance'
			if ("included" in feature && feature.included !== undefined) {
				transformedFeature.granted_balance = feature.included;
				delete transformedFeature.included;
			}

			// Pass through reset object as-is (already nested in SDK format)
			// Just strip out reset_when_enabled if present (we ignore it)
			const featureAny = feature as Record<string, unknown>;
			if (
				"reset" in featureAny &&
				featureAny.reset &&
				typeof featureAny.reset === "object"
			) {
				const reset = { ...(featureAny.reset as Record<string, unknown>) };
				delete reset.reset_when_enabled; // Ignore this field
				transformedFeature.reset = reset;
			}

			// Transform nested price object: 'billing_method' -> 'usage_model'
			if (
				"price" in feature &&
				feature.price &&
				typeof feature.price === "object"
			) {
				const price = feature.price as Record<string, unknown>;
				const transformedPrice = { ...price };

				if ("billing_method" in price) {
					// SDK uses billing_method (prepaid | usage_based), API uses usage_model (prepaid | pay_per_use)
					transformedPrice.usage_model =
						price.billing_method === "usage_based"
							? "pay_per_use"
							: price.billing_method;
					delete transformedPrice.billing_method;
				}

				// Copy interval to price from reset if needed
				const resetObj = transformedFeature.reset as
					| Record<string, unknown>
					| undefined;
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

/**
 * Push a single feature (create or update)
 */
export async function pushFeature(
	feature: Feature,
): Promise<{ action: "created" | "updated" }> {
	const secretKey = getSecretKey();

	try {
		await upsertFeature({
			secretKey,
			feature: feature as Record<string, unknown>,
		});
		return { action: "created" };
	} catch (error: unknown) {
		const apiError = error as {
			response?: { code?: string };
		};
		if (
			apiError.response?.code === "duplicate_feature_id" ||
			apiError.response?.code === "product_already_exists"
		) {
			await updateFeature({
				secretKey,
				featureId: feature.id,
				feature: feature as Record<string, unknown>,
			});
			return { action: "updated" };
		}
		throw error;
	}
}

/**
 * Push a single plan (create or update)
 */
export async function pushPlan(
	plan: Plan,
	remotePlans: Plan[],
): Promise<{ action: "created" | "updated" | "versioned" }> {
	const secretKey = getSecretKey();
	const remotePlan = remotePlans.find((p) => p.id === plan.id);
	const apiPlan = transformPlanForApi(plan);

	if (!remotePlan) {
		await createPlan({ secretKey, plan: apiPlan });
		return { action: "created" };
	}

	// Prepare update payload with swapNullish/swapFalse logic
	const updatePayload = { ...apiPlan };

	// Handle swapNullish for group field
	if (
		plan.group === undefined &&
		remotePlan.group !== undefined &&
		remotePlan.group !== null
	) {
		updatePayload.group = null;
	} else if (
		plan.group === null &&
		remotePlan.group !== undefined &&
		remotePlan.group !== null
	) {
		updatePayload.group = null;
	}

	// Handle swapFalse for add_on field
	if (plan.add_on === undefined && remotePlan.add_on === true) {
		updatePayload.add_on = false;
	}

	// Handle swapFalse for auto_enable (maps to 'default' in API)
	if (
		(plan as Plan & { auto_enable?: boolean }).auto_enable === undefined &&
		(remotePlan as Plan & { default?: boolean }).default === true
	) {
		updatePayload.default = false;
	}

	await updatePlan({ secretKey, planId: plan.id, plan: updatePayload });

	// We don't know if it actually versioned here, caller should track based on analysis
	return { action: "updated" };
}

/**
 * Delete a feature
 */
export async function deleteFeature(featureId: string): Promise<void> {
	const secretKey = getSecretKey();
	await deleteFeatureApi({ secretKey, featureId });
}

/**
 * Archive a feature
 */
export async function archiveFeature(featureId: string): Promise<void> {
	const secretKey = getSecretKey();
	await archiveFeatureApi({ secretKey, featureId });
}

/**
 * Un-archive a feature
 */
export async function unarchiveFeature(featureId: string): Promise<void> {
	const secretKey = getSecretKey();
	await unarchiveFeatureApi({ secretKey, featureId });
}

/**
 * Delete a plan
 */
export async function deletePlan(planId: string): Promise<void> {
	const secretKey = getSecretKey();
	await deletePlanApi({ secretKey, planId, allVersions: true });
}

/**
 * Archive a plan
 */
export async function archivePlan(planId: string): Promise<void> {
	const secretKey = getSecretKey();
	await archivePlanApi({ secretKey, planId });
}

/**
 * Un-archive a plan
 */
export async function unarchivePlan(planId: string): Promise<void> {
	const secretKey = getSecretKey();
	await unarchivePlanApi({ secretKey, planId });
}
