/**
 * Template configurations index
 */

import type { Feature, Plan } from "../../../../source/compose/models/index.js";
import * as blacktriangle from "./blacktriangle.config.js";
import * as ratgpt from "./ratgpt.config.js";
import * as aksiom from "./aksiom.config.js";

export interface TemplateConfig {
	features: Feature[];
	plans: Plan[];
}

export const templateConfigs: Record<string, TemplateConfig> = {
	Blacktriangle: {
		features: blacktriangle.features,
		plans: blacktriangle.plans,
	},
	RatGPT: {
		features: ratgpt.features,
		plans: ratgpt.plans,
	},
	Aksiom: {
		features: aksiom.features,
		plans: aksiom.plans,
	},
};
