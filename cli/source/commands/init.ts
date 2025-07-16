import chalk from 'chalk';

import Pull from './pull.js';
import AuthCommand from './auth.js';
import { API_KEY_VAR } from '../cli.js';

export default async function Init({config, autumnStore}: {config: any, autumnStore: any}) {
    // Check if keys exist in autumnStore
    const keys = autumnStore.get('keys');
    let apiKey = keys && (keys.sandboxKey || keys.prodKey);
    if (apiKey) {
        process.env[API_KEY_VAR] = apiKey;
        console.log(chalk.green('API keys found. Pulling latest config...'));
        await Pull({config});
        console.log(chalk.green('Project initialized and config pulled successfully!'));
    } else {
        console.log(chalk.yellow('No API keys found. Running authentication...'));
        await AuthCommand(autumnStore);
        // After authentication, get the keys again
        const newKeys = autumnStore.get('keys');
        let newApiKey = newKeys && (newKeys.sandboxKey || newKeys.prodKey);
        if (newApiKey) {
            process.env[API_KEY_VAR] = newApiKey;
        }
        await Pull({config});
        console.log(chalk.green('Project initialized! You are now authenticated and config has been pulled.'));
    }
}
