import open from 'open';
import {getOTP} from '../core/auth.js';
import Conf from 'conf';
import {updateCLIStripeKeys} from '../core/api.js';
import chalk from 'chalk';
import { input, password, confirm } from '@inquirer/prompts';

const passwordTheme = {
	style: {
		answer: (text: string) => {
			return chalk.magenta('*'.repeat(text.length));
		}
	}
}
const inputTheme = {
	style: {
		answer: (text: string) => {
			return chalk.magenta(text);
		}
	}
}

export default async function AuthCommand(autumnConfig: Conf) {
	if (autumnConfig.get('keys')) {
		let shouldReauth = await confirm({
			message: 'You are already authenticated. Would you like to re-authenticate?',
			theme: inputTheme,
		})
		if (!shouldReauth) {
			return;
		}
	}
	open('http://152.67.152.51:3000/dev/cli');

	const otp = await input({
		message: 'Enter OTP:',
		theme: inputTheme
	})

	const keyInfo = await getOTP(otp);

	if (!keyInfo.stripe_connected) {
		let connectStripe = await confirm({
			message:
				"It seems like your organization doesn't have any Stripe keys connected. Would you like to connect them now?",
			theme: inputTheme,
		})
		if (connectStripe) {
			// Ask for stripe Keys
			let stripeTestKey = await password({
				message: 'Enter Stripe Test Key:',
				mask: '*',	
				theme: passwordTheme,
			})
			// let stripeLiveKey = await password({
			// 	message: 'Enter Stripe Live Key:',
			// 	mask: '*',
			// 	theme: passwordTheme,
			// })
			await updateCLIStripeKeys(
				stripeTestKey,
				stripeTestKey,
				keyInfo.stripeFlowAuthKey,
			);
		} else {
			
			console.log(
				chalk.yellow("Okay, no worries. Go to the Autumn dashboard when you're ready!"),
			);
		}
	}

	autumnConfig.set('keys', {
		sandboxKey: keyInfo.sandboxKey,
		liveKey: keyInfo.liveKey,
	});

	console.log(
		chalk.green('Success! Keys have been stored locally. You may now use the CLI.'),
	);
}
