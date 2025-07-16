# Autumn CLI

The CLI tool for [Autumn](https://useautumn.com)'s REST API.

## Features
Features

- Create your features in products **in-code**.
- Authenticate with the CLI tool.
- Easily push and pull changes to and from Autumn.

## Usage

```sh
Usage: cli [options] [command]

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
	product,
	priceItem,
	featureItem,
	pricedFeatureItem,
} from 'autumn-js/compose';

const seats = feature({
	id: 'seats',
	name: 'Seats',
	type: 'continuous_use',
});

const messages = feature({
	id: 'messages',
	name: 'Messages',
	type: 'single_use',
});

const pro = product({
	id: 'pro',
	name: 'Pro',
	items: [
		// 500 messages per month
		featureItem({
			feature_id: messages.id,
			included_usage: 500,
			interval: 'month',
		}),

		// $10 per seat per month
		pricedFeatureItem({
			feature_id: seats.id,
			price: 10,
			interval: 'month',
		}),

		// $50 / month
		priceItem({
			price: 50,
			interval: 'month',
		}),
	],
});

export default {
	features: [seats, messages],
	products: [pro],
};
```

