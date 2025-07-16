import fs from 'fs';
import chalk from 'chalk';

export function snakeCaseToCamelCase(value: string) {
    return value.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

export function storeToEnv(prodKey: string, sandboxKey: string) {
	const envPath = `${process.cwd()}/.env`;
	const envVars = `# AUTUMN_SECRET_KEY=${prodKey}\nAUTUMN_SECRET_KEY=${sandboxKey}\n`;

	if (fs.existsSync(envPath)) {
		fs.appendFileSync(envPath, envVars);
		console.log(chalk.green('.env file found. Appended keys.'));
	} else {
		fs.writeFileSync(envPath, envVars);
		console.log(chalk.green('.env file not found. Created new .env file and wrote keys.'));
	}
}

export function readFromEnv() {
    const envPath = `${process.cwd()}/.env`;
    if (!fs.existsSync(envPath)) {
        return undefined;
    }
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/^AUTUMN_SECRET_KEY=(.*)$/m);
    return match ? match[1] : undefined;
}