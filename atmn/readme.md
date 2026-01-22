# Autumn CLI

The CLI tool for [Autumn](https://useautumn.com)'s REST API.

## Features

- Create your features and plans **in-code**.
- Authenticate with the CLI tool.
- Easily push and pull changes to and from Autumn.

## Usage

```sh
Usage: atmn [options] [command]

Options:
  -h, --help      display help for command

Commands:
  push [options]  Push changes to Autumn
  pull [options]  Pull changes from Autumn
  init            Initialize an Autumn project.
  auth [options]  Authenticate with Autumn
  dashboard       Open the Autumn dashboard in your browser
  version         Show the version of Autumn
  help [command]  display help for command
```

## Getting started
Run `npx atmn init` in your project folder. This will prompt you to authenticate with Autumn and
downloads your Autumn keys to the root level `.env`.

If you make a change locally in your `autumn.config.ts` file and you'd like to push, simply run the `push` command:
```sh
npx atmn push
```

Likewise, to pull changes from Autumn, run the `pull` command:
```sh
npx atmn pull
```

If you'd like to access your production environment, go to your `.env` and uncomment out the
production key, and comment out your sandbox key.

## Example `autumn.config.ts`

```typescript autumn.config.ts
import {
	feature,
	plan,
	planFeature,
} from 'atmn';

export const seats = feature({
	id: 'seats',
	name: 'Seats',
	type: 'continuous_use',
});

export const messages = feature({
	id: 'messages',
	name: 'Messages',
	type: 'single_use',
});

export const pro = plan({
	id: 'pro',
	name: 'Pro',
	description: 'Professional plan for growing teams',
	add_on: false,
	auto_enable: false,
	price: {
		amount: 50,
		interval: 'month',
	},
	features: [
		// 500 messages per month
		planFeature({
			feature_id: messages.id,
			granted: 500,
			reset: { interval: 'month' },
		}),

		// $10 per seat per month
		planFeature({
			feature_id: seats.id,
			granted: 1,
			price: {
				amount: 10,
				interval: 'month',
				billing_method: 'usage_based',
				billing_units: 1,
			},
		}),
	],
});

export default {
	features: [seats, messages],
	plans: [pro],
};
```

