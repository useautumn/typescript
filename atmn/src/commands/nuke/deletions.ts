/**
 * Batch deletion logic for nuke command
 */

import { DELETE_CONCURRENCY } from "../../constants.js";
import type { DeletionProgress } from "./types.js";

/**
 * Delete customers in batches with progress callbacks
 */
export async function deleteCustomersBatch(
	customers: { id: string }[],
	deleteCustomerFn: (id: string) => Promise<void>,
	onProgress?: (progress: DeletionProgress) => void
): Promise<void> {
	const concurrency = Math.max(
		1,
		Math.min(customers.length, DELETE_CONCURRENCY)
	);

	let completed = 0;
	const startTime = Date.now();

	for (let i = 0; i < customers.length; i += concurrency) {
		const batch = customers.slice(i, i + concurrency);

		await Promise.all(
			batch.map(async (customer) => {
				await deleteCustomerFn(customer.id);
				completed++;

				if (onProgress) {
					const elapsed = (Date.now() - startTime) / 1000;
					const rate = elapsed > 0 ? completed / elapsed : 0;

					onProgress({
						phase: "customers",
						current: completed,
						total: customers.length,
						rate,
					});
				}
			})
		);
	}
}

/**
 * Delete plans sequentially with progress callbacks
 */
export async function deletePlansSequential(
	plans: { id: string }[],
	deletePlanFn: (id: string, allVersions: boolean) => Promise<void>,
	onProgress?: (progress: DeletionProgress) => void
): Promise<void> {
	const startTime = Date.now();

	for (const [i, plan] of plans.entries()) {
		await deletePlanFn(plan.id, true); // allVersions = true

		if (onProgress) {
			const elapsed = (Date.now() - startTime) / 1000;
			const rate = elapsed > 0 ? (i + 1) / elapsed : 0;

			onProgress({
				phase: "plans",
				current: i + 1,
				total: plans.length,
				rate,
			});
		}
	}
}

/**
 * Delete features sequentially with progress callbacks
 * Sorts credit_system features first (dependencies)
 */
export async function deleteFeaturesSequential(
	features: { id: string; type: string }[],
	deleteFeatureFn: (id: string) => Promise<void>,
	onProgress?: (progress: DeletionProgress) => void
): Promise<void> {
	// Sort: credit_system features first (they are dependencies)
	const sorted = [...features].sort((a) =>
		a.type === "credit_system" ? -1 : 1
	);

	const startTime = Date.now();

	for (const [i, feature] of sorted.entries()) {
		await deleteFeatureFn(feature.id);

		if (onProgress) {
			const elapsed = (Date.now() - startTime) / 1000;
			const rate = elapsed > 0 ? (i + 1) / elapsed : 0;

			onProgress({
				phase: "features",
				current: i + 1,
				total: sorted.length,
				rate,
			});
		}
	}
}
