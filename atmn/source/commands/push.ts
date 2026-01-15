// @ts-nocheck
import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import yoctoSpinner from "yocto-spinner";
import type { Feature, Plan } from "../compose/index.js";
import { FRONTEND_URL } from "../constants.js";
import { deleteFeature, deletePlan } from "../core/api.js";
import {
	checkForDeletables,
	checkPlanForConfirmation,
	upsertFeature,
	upsertPlan,
} from "../core/push.js";
import {
	checkFeatureDeletionData,
	updateFeature,
} from "../core/requests/featureRequests.js";
import {
	getPlanDeleteInfo,
	updatePlan,
} from "../core/requests/prodRequests.js";
import { initSpinner } from "../core/utils.js";

const createSpinner = ({ message }: { message?: string }) => {
	const spinner = yoctoSpinner({
		text: message ?? "",
	});
	spinner.start();

	return spinner;
};

const gatherPlanDeletionDecisions = async ({
	plansToDelete,
	yes,
}: {
	plansToDelete: string[];
	yes: boolean;
}) => {
	const planDeletionDecisions = new Map<
		string,
		"delete" | "archive" | "skip"
	>();
	const batchCheckPlans = [];

	for (const planId of plansToDelete) {
		batchCheckPlans.push(getPlanDeleteInfo({ planId }));
	}

	const checkPlanResults = await Promise.all(batchCheckPlans);

	for (let i = 0; i < plansToDelete.length; i++) {
		const planId = plansToDelete[i];
		const result = checkPlanResults[i];

		if (!planId) continue;

		if (result && result.totalCount > 0) {
			const otherCustomersText =
				result.totalCount > 1
					? ` and ${result.totalCount - 1} other customer(s)`
					: "";
			const customerNameText = result.customerName || "Unknown Customer";
			const shouldArchive =
				yes ||
				(await confirm({
					message: `Plan ${planId} has customer ${customerNameText}${otherCustomersText}. As such, you cannot delete it. Would you like to archive the plan instead?`,
				}));
			planDeletionDecisions.set(planId, shouldArchive ? "archive" : "skip");
		} else {
			planDeletionDecisions.set(planId, "delete");
		}
	}

	return planDeletionDecisions;
};

const handlePlanDeletion = async ({
	plansToDelete,
	yes,
}: {
	plansToDelete: string[];
	yes: boolean;
}) => {
	const planDeletionDecisions = await gatherPlanDeletionDecisions({
		plansToDelete,
		yes,
	});

	for (const planId of plansToDelete) {
		const decision = planDeletionDecisions.get(planId);

		if (decision === "delete") {
			const shouldDelete =
				yes ||
				(await confirm({
					message: `Delete plan [${planId}]?`,
				}));

			if (shouldDelete) {
				const s = createSpinner({ message: `Deleting plan [${planId}]` });
				await deletePlan({ id: planId });
				s.success(`Plan [${planId}] deleted successfully!`);
			}
		} else if (decision === "archive") {
			const s = createSpinner({ message: `Archiving plan [${planId}]` });
			await updatePlan({ planId, update: { archived: true } });
			s.success(`Plan [${planId}] archived successfully!`);
		}
	}
};

const pushFeatures = async ({
	features,
	allFeatures,
	yes,
}: {
	features: Feature[];
	allFeatures: Feature[];
	yes: boolean;
}) => {
	// Handle archived features first (synchronously)

	for (const feature of features) {
		const isArchived = allFeatures.find(
			(f: Feature) => f.id === feature.id,
		)?.archived;

		if (isArchived) {
			const shouldUnarchive =
				yes ||
				(await confirm({
					message: `Feature ${feature.id} is currently archived. Would you like to un-archive it before pushing?`,
				}));
			if (shouldUnarchive) {
				const s = createSpinner({
					message: `Un-archiving feature [${feature.id}]`,
				});
				await updateFeature({ id: feature.id, update: { archived: false } });

				s.success(`Feature [${feature.id}] un-archived successfully!`);
			}
		}
	}

	// Now push all features
	const batchFeatures = [];
	const s = initSpinner(`Pushing features`);
	for (const feature of features) {
		batchFeatures.push(upsertFeature(feature, s));
	}
	await Promise.all(batchFeatures);
	s.success(`Features pushed successfully!`);
	console.log(chalk.dim("\nFeatures pushed:"));
	features.forEach((feature: Feature) => {
		console.log(chalk.cyan(`  • ${feature.id}`));
	});
	console.log(); // Empty line for spacing
};

const gatherPlanDecisions = async ({
	plans,
	curPlans,
	yes,
}: {
	plans: Plan[];
	curPlans: any[];
	yes: boolean;
}) => {
	const planDecisions = new Map();
	const batchCheckPlans = [];

	for (const plan of plans) {
		batchCheckPlans.push(
			checkPlanForConfirmation({
				curPlans,
				plan,
			}),
		);
	}

	const checkPlanResults = await Promise.all(batchCheckPlans);

	for (const result of checkPlanResults) {
		if (result.archived) {
			const shouldUnarchive =
				yes ||
				(await confirm({
					message: `Plan ${result.id} is currently archived. Would you like to un-archive it before pushing?`,
				}));
			if (shouldUnarchive) {
				const s = createSpinner({
					message: `Un-archiving plan [${result.id}]`,
				});
				await updatePlan({
					planId: result.id,
					update: { archived: false },
				});
				s.success(`Plan [${result.id}] un-archived successfully!`);
				planDecisions.set(result.id, true);
			} else {
				planDecisions.set(result.id, false);
			}
		}

		if (result.will_version) {
			const shouldUpdate =
				yes ||
				(await confirm({
					message: `Plan ${result.id} has customers on it and updating it will create a new version.\nAre you sure you'd like to continue? `,
				}));
			planDecisions.set(result.id, shouldUpdate);
		} else {
			planDecisions.set(result.id, true);
		}
	}

	return planDecisions;
};

const pushPlans = async ({
	plans,
	curPlans,
	planDecisions,
	yes,
}: {
	plans: Plan[];
	curPlans: any[];
	planDecisions: Map<string, boolean>;
	yes: boolean;
}) => {
	const s2 = initSpinner(`Pushing plans`);
	const batchPlans = [];

	for (const plan of plans) {
		const shouldUpdate = planDecisions.get(plan.id);
		batchPlans.push(upsertPlan({ curPlans, plan, spinner: s2, shouldUpdate }));
	}

	const planResults = await Promise.all(batchPlans);
	s2.success(`Plans pushed successfully!`);
	console.log(chalk.dim("\nPlans pushed:"));
	planResults.forEach((result: { id: string; action: string }) => {
		const action = result.action;
		console.log(
			chalk.cyan(
				`  • ${result.id} ${action === "skipped" ? `(${action})` : ""}`,
			),
		);
	});
	console.log(); // Empty line for spacing

	return planResults;
};

const gatherFeatureDeletionDecisions = async ({
	featuresToDelete,
	currentFeatures,
	yes,
}: {
	featuresToDelete: string[];
	currentFeatures: Feature[];
	yes: boolean;
}) => {
	const featureDeletionDecisions = new Map<
		string,
		"delete" | "archive" | "skip"
	>();
	const batchCheckFeatures = [];

	for (const featureId of featuresToDelete) {
		batchCheckFeatures.push(checkFeatureDeletionData({ featureId }));
	}

	const checkFeatureResults = await Promise.all(batchCheckFeatures);

	for (let i = 0; i < featuresToDelete.length; i++) {
		const featureId = featuresToDelete[i];
		const result = checkFeatureResults[i];

		if (!featureId) continue;

		// Check locally if this feature is referenced by any credit system in the config
		const referencingCreditSystems = currentFeatures.filter(
			(f) =>
				f.type === "credit_system" &&
				f.credit_schema?.some((cs) => cs.metered_feature_id === featureId),
		);

		if (referencingCreditSystems.length >= 1) {
			// Feature is referenced by credit system(s) in the current config - must archive
			const firstCreditSystem = referencingCreditSystems[0]?.id;
			const creditSystemText =
				referencingCreditSystems.length === 1
					? `the "${firstCreditSystem}" credit system`
					: referencingCreditSystems.length === 2
						? `"${firstCreditSystem}" and one other credit system`
						: `"${firstCreditSystem}" and ${referencingCreditSystems.length - 1} other credit systems`;

			const shouldArchive =
				yes ||
				(await confirm({
					message: `Feature ${featureId} is used by ${creditSystemText}. As such, you cannot delete it. Would you like to archive the feature instead?`,
				}));
			featureDeletionDecisions.set(
				featureId,
				shouldArchive ? "archive" : "skip",
			);
		} else if (result && result.totalCount > 0) {
			const otherProductsText =
				result.totalCount > 1
					? ` and ${result.totalCount - 1} other products`
					: "";
			const productNameText = result.productName || "Unknown Product";
			const shouldArchive =
				yes ||
				(await confirm({
					message: `Feature ${featureId} is being used by product ${productNameText}${otherProductsText}. As such, you cannot delete it. Would you like to archive the feature instead?`,
				}));
			featureDeletionDecisions.set(
				featureId,
				shouldArchive ? "archive" : "skip",
			);
		} else {
			featureDeletionDecisions.set(featureId, "delete");
		}
	}

	return featureDeletionDecisions;
};

const handleFeatureDeletion = async ({
	featuresToDelete,
	allFeatures,
	currentFeatures,
	yes,
}: {
	featuresToDelete: string[];
	allFeatures: Feature[];
	currentFeatures: Feature[];
	yes: boolean;
}) => {
	const featureDeletionDecisions = await gatherFeatureDeletionDecisions({
		featuresToDelete,
		currentFeatures,
		yes,
	});

	// Sort features to delete credit systems first, then other features
	// This prevents issues when deleting a credit system and its referenced metered features at the same time
	const sortedFeaturesToDelete = [...featuresToDelete].sort((a, b) => {
		const featureA = allFeatures.find((f) => f.id === a);
		const featureB = allFeatures.find((f) => f.id === b);

		// Credit systems should be deleted first (return -1)
		if (
			featureA?.type === "credit_system" &&
			featureB?.type !== "credit_system"
		) {
			return -1;
		}
		if (
			featureA?.type !== "credit_system" &&
			featureB?.type === "credit_system"
		) {
			return 1;
		}

		return 0;
	});

	for (const featureId of sortedFeaturesToDelete) {
		const decision = featureDeletionDecisions.get(featureId);

		if (decision === "delete") {
			const shouldDelete =
				yes ||
				(await confirm({
					message: `Delete feature [${featureId}]?`,
				}));

			if (shouldDelete) {
				const s = createSpinner({ message: `Deleting feature [${featureId}]` });
				await deleteFeature({ id: featureId });
				s.success(`Feature [${featureId}] deleted successfully!`);
			}
		} else if (decision === "archive") {
			const s = createSpinner({ message: `Archiving feature [${featureId}]` });
			await updateFeature({ id: featureId, update: { archived: true } });
			s.success(`Feature [${featureId}] archived successfully!`);
		}
	}
};

const showSuccessMessage = ({ env, prod }: { env: string; prod: boolean }) => {
	console.log(
		chalk.magentaBright(`Success! Changes have been pushed to ${env}.`),
	);

	if (prod) {
		console.log(
			chalk.magentaBright(`You can view the plans at ${FRONTEND_URL}/products`),
		);
	} else {
		console.log(
			chalk.magentaBright(
				`You can view the plans at ${FRONTEND_URL}/sandbox/products`,
			),
		);
	}
};

export default async function Push({
	config,
	yes,
	prod,
}: {
	config: {
		features: Feature[];
		plans: Plan[];
		env: string;
	};
	yes: boolean;
	prod: boolean;
}) {
	const { features, plans, env } = config;

	if (env === "prod") {
		const shouldProceed =
			yes ||
			(await confirm({
				message:
					"You are about to push products to your prod environment. Are you sure you want to proceed?",
				default: false,
			}));
		if (!shouldProceed) {
			console.log(chalk.yellow("Aborting..."));
			process.exit(1);
		}
	}

	const { allFeatures, curPlans, featuresToDelete, plansToDelete } =
		await checkForDeletables(features, plans);

	await handlePlanDeletion({ plansToDelete, yes });
	await pushFeatures({ features, allFeatures, yes });

	const planDecisions = await gatherPlanDecisions({
		plans,
		curPlans,
		yes,
	});
	await pushPlans({ plans, curPlans, planDecisions, yes });
	await handleFeatureDeletion({ featuresToDelete, allFeatures, currentFeatures: features, yes });

	showSuccessMessage({ env, prod });
}
