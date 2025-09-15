import open from 'open';
import chalk from 'chalk';
import {input, password, confirm} from '@inquirer/prompts';
import {storeToEnv, readFromEnv} from '../core/utils.js';

import {getOTP} from '../core/auth.js';
import {updateCLIStripeKeys} from '../core/api.js';
import {FRONTEND_URL} from '../constants.js';

const passwordTheme = {
	style: {
		answer: (text: string) => {
			return chalk.magenta('*'.repeat(text.length));
		},
	},
};
const inputTheme = {
	style: {
		answer: (text: string) => {
			return chalk.magenta(text);
		},
	},
};

export default async function AuthCommand() {
	if (readFromEnv({bypass: true})) {
		let shouldReauth = await confirm({
			message:
				'You are already authenticated. Would you like to re-authenticate?',
			theme: inputTheme,
		});
		if (!shouldReauth) return;
	}
	open(`${FRONTEND_URL}/dev/cli`);

	const otp = await input({
		message: 'Enter OTP:',
		theme: inputTheme,
	});

	const keyInfo = await getOTP(otp);

	if (!keyInfo.stripe_connected) {
		let connectStripe = await confirm({
			message:
				"It seems like your organization doesn't have any Stripe keys connected. Would you like to connect your Stripe test secret key now?",
			theme: inputTheme,
		});
		if (connectStripe) {
			// Ask for stripe Keys
			let stripeTestKey = await password({
				message: 'Enter Stripe Test Secret Key:',
				mask: '*',
				theme: passwordTheme,
			});
			await updateCLIStripeKeys({
				stripeSecretKey: stripeTestKey,
				autumnSecretKey: keyInfo.sandboxKey,
			});
			console.log(
				chalk.green(
					'Stripe test secret key has been saved to your .env file. To connect your Stripe live secret key, please visit the Autumn dashboard here: https://app.useautumn.com/dev?tab=stripe',
				),
			);
		} else {
			console.log(
				chalk.yellow(
					"Okay, no worries. Go to the Autumn dashboard when you're ready!",
				),
			);
		}
	}

	await storeToEnv(keyInfo.prodKey, keyInfo.sandboxKey);

	console.log(
		chalk.green(
			'Success! Sandbox and production keys have been saved to your .env file.\n`atmn` uses the AUTUMN_SECRET_KEY to authenticate with the Autumn API.',
		),
	);
}
