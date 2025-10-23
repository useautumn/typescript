import {
	feature,
	plan,
	planFeature,
} from "./builders/builderFunctions.js";
import type { Feature } from "./models/featureModels.js";
import type {
	Plan,
	PlanFeature,
	FreeTrial,
} from "./models/planModels.js";

export { plan, feature, planFeature };

export type {
	Feature,
	Plan,
	PlanFeature,
	FreeTrial,
};

export type Infinity = "infinity";

// CLI types

export type AutumnConfig = {
	plans: Plan[];
	features: Feature[];
};
