import type Autumn from "@sdk";

export interface PricingCardOverride {
	planId?: string;

	name?: string;
	description?: string;
	recommendText?: string;
	everythingFrom?: string;

	button?: {
		text?: string;
		onClick?: () => Promise<void> | void;
	};

	price?: {
		display?: {
			primaryText?: string;
			secondaryText?: string;
		};
	};

	features?: {
		featureId: string | null;
		display?: {
			primaryText?: string;
			secondaryText?: string;
		};
	}[];
}

export interface PricingCardData {
	plan: Autumn.Plan | null;
	override: {
		name?: string;
		description?: string;
		recommend_text?: string;
		everything_from?: string;

		button?: {
			text?: string;
			onClick?: () => Promise<void> | void;
		};

		price?: {
			display?: {
				primary_text?: string;
				secondary_text?: string;
			};
		};

		features?: {
			feature_id: string | null;
			display?: {
				primary_text?: string;
				secondary_text?: string;
			};
		}[];
	};
}
