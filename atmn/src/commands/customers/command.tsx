import { render } from "ink";
import React from "react";
import { QueryProvider } from "../../views/react/components/providers/QueryProvider.js";
import { CustomersView } from "../../views/react/customers/CustomersView.js";
import { AppEnv } from "../../lib/env/detect.js";

export interface CustomersCommandOptions {
	prod?: boolean;
}

/**
 * Customers command entry point
 * Renders the interactive customers view
 */
export async function customersCommand(
	options: CustomersCommandOptions = {},
): Promise<void> {
	const environment = options.prod ? AppEnv.Live : AppEnv.Sandbox;

	if (process.stdout.isTTY) {
		// Interactive mode - render Ink UI
		const instance = render(
			<QueryProvider>
				<CustomersView
					environment={environment}
					onExit={() => {
						// Clear the terminal output for a clean exit
						instance.clear();
						instance.unmount();
						process.exit(0);
					}}
				/>
			</QueryProvider>,
		);

		// Handle Ctrl+C - clear terminal before exit
		process.on("SIGINT", () => {
			instance.clear();
			instance.unmount();
			process.exit(0);
		});
	} else {
		// Non-TTY mode - plain text fallback
		console.log("atmn customers - Autumn CLI");
		console.log(
			"This command requires an interactive terminal. Please run in a TTY environment.",
		);
		process.exit(1);
	}
}

export default customersCommand;
