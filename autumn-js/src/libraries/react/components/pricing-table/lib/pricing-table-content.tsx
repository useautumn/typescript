import type Autumn from "@sdk";

export const getPricingTableContent = ({
	plan,
}: {
	plan: Autumn.Plan | null;
}) => {
	if (!plan) {
		return {
			buttonText: <p>Get Started</p>,
		};
	}

	// TODO 4: hasTrial = plan.free_trial and !trial_used
	const hasTrial = plan.free_trial;
	const isOneOff = plan.price?.interval === "one_off";
	const scenario = plan.customer_eligibility?.scenario;

	console.log(`Plan: ${plan.id}, Scenario: ${scenario}`);

	if (hasTrial) {
		return {
			buttonText: <p>Start Free Trial</p>,
		};
	}

	switch (scenario) {
		case "scheduled":
			return {
				buttonText: <p>Plan Scheduled</p>,
			};

		case "active":
			return {
				buttonText: <p>Current Plan</p>,
			};

		case "new":
			if (isOneOff) {
				return {
					buttonText: <p>Purchase</p>,
				};
			}

			return {
				buttonText: <p>Get started</p>,
			};

		case "renew":
			return {
				buttonText: <p>Renew</p>,
			};

		case "upgrade":
			return {
				buttonText: <p>Upgrade</p>,
			};

		case "downgrade":
			return {
				buttonText: <p>Downgrade</p>,
			};

		case "cancel":
			return {
				buttonText: <p>Cancel Plan</p>,
			};

		default:
			return {
				buttonText: <p>Get Started</p>,
			};
	}
};
