/**
 * Rezi TUI app for the `atmn login` command.
 * OAuth flow: check existing → confirm reauth → open browser → wait → save keys → complete
 */
import { ui, rgb, type VNode } from "@rezi-ui/core";
import { createNodeApp } from "@rezi-ui/node";
import { CLI_CLIENT_ID } from "../../../commands/auth/constants.js";
import {
	getApiKeysWithToken,
	startOAuthFlow,
} from "../../../commands/auth/oauth.js";
import { fetchOrganizationMe } from "../../../lib/api/endpoints/index.js";
import { readFromEnv } from "../../../lib/utils.js";
import { storeEnvKeys } from "../../../lib/hooks/useEnvironmentStore.js";
import { card, colors, loadingText } from "../helpers.js";

type LoginPhase =
	| "checking"
	| "confirm_reauth"
	| "opening_browser"
	| "waiting_auth"
	| "creating_keys"
	| "saving_keys"
	| "complete"
	| "error";

interface OrgInfo {
	name: string;
	slug: string;
}

interface LoginState {
	phase: LoginPhase;
	error: string | null;
	orgInfo: OrgInfo | null;
	startTime: number;
	reauthSelection: string;
}

export async function createLoginApp(opts?: { onComplete?: () => void }) {
	let runOAuth: () => Promise<void>;

	const app = createNodeApp<LoginState>({
		initialState: {
			phase: "checking",
			error: null,
			orgInfo: null,
			startTime: Date.now(),
			reauthSelection: "yes",
		},
	});

	app.view((s) => {
		const children: VNode[] = [];

		// Header
		children.push(card("🍂 Logging into Autumn", []));

		// Checking phase
		if (s.phase === "checking") {
			children.push(card("🔍 Checking", [loadingText("Checking existing authentication...")]));
		}

		// Re-auth confirmation
		if (s.phase === "confirm_reauth") {
			children.push(
				card("🔑 Already Authenticated", [
					ui.text("You already have API keys configured."),
					ui.text("Would you like to re-authenticate?", { style: { fg: colors.gray } }),
					ui.select({
						id: "reauth",
						value: s.reauthSelection,
						options: [
							{ value: "yes", label: "Yes, re-authenticate" },
							{ value: "no", label: "No, keep current keys" },
						],
						onChange: (v) => {
							app.update((prev) => ({ ...prev, reauthSelection: v }));
							if (v === "yes") {
								app.update((prev) => ({ ...prev, phase: "opening_browser" }));
								runOAuth();
							} else {
								app.update((prev) => ({ ...prev, phase: "complete" }));
								setTimeout(() => {
									app.stop();
									opts?.onComplete?.();
								}, 500);
							}
						},
					}),
				]),
			);
		}

		// Browser phases
		if (s.phase === "opening_browser" || s.phase === "waiting_auth") {
			children.push(
				card("🌐 Browser", [
					loadingText(
						s.phase === "opening_browser"
							? "Opening browser..."
							: "Waiting for authentication...",
					),
					ui.text("Complete sign-in in your browser, then select an org.", {
						style: { fg: colors.gray },
					}),
				]),
			);
		}

		// Creating keys
		if (s.phase === "creating_keys") {
			children.push(card("🔑 API Keys", [loadingText("Creating API keys...")]));
		}

		// Saving keys
		if (s.phase === "saving_keys") {
			children.push(card("🔑 API Keys", [loadingText("Saving keys to .env...")]));
		}

		// Complete with org info
		if (s.phase === "complete" && s.orgInfo) {
			children.push(
				card("🏢 Organization", [
					ui.row({ gap: 1 }, [
						ui.text("Name:", { style: { fg: colors.gray } }),
						ui.text(s.orgInfo.name),
					]),
					ui.row({ gap: 1 }, [
						ui.text("Slug:", { style: { fg: colors.gray } }),
						ui.text(s.orgInfo.slug),
					]),
				]),
			);
			children.push(
				card("🔑 API Keys", [
					ui.row({}, [
						ui.text("✓", { style: { fg: colors.green } }),
						ui.text(" AUTUMN_SECRET_KEY "),
						ui.text("saved to .env", { style: { fg: colors.gray } }),
					]),
					ui.row({}, [
						ui.text("✓", { style: { fg: colors.green } }),
						ui.text(" AUTUMN_PROD_SECRET_KEY "),
						ui.text("saved to .env", { style: { fg: colors.gray } }),
					]),
				]),
			);
			children.push(
				ui.column({ mt: 1 }, [
					ui.text("✨ Ready! Run `atmn push` to sync your config.", {
						style: { fg: colors.green },
					}),
				]),
			);
		}

		// Complete but cancelled reauth
		if (s.phase === "complete" && !s.orgInfo) {
			children.push(
				ui.column({ mt: 1 }, [
					ui.text("Keeping existing authentication.", { style: { fg: colors.gray } }),
				]),
			);
		}

		// Error
		if (s.phase === "error") {
			children.push(
				card("✗ Authentication Failed", [
					ui.text(s.error || "An unknown error occurred.", { style: { fg: colors.red } }),
					ui.text("Please try again with `atmn login`.", {
						style: { fg: colors.gray },
					}),
				]),
			);
		}

		return ui.column({ mb: 1 }, children);
	});

	app.keys({
		"ctrl+c": () => {
			app.stop();
			process.exit(0);
		},
	});

	runOAuth = async () => {
		try {
			app.update((s) => ({ ...s, phase: "waiting_auth" }));
			const { tokens } = await startOAuthFlow(CLI_CLIENT_ID);

			app.update((s) => ({ ...s, phase: "creating_keys" }));
			const data = await getApiKeysWithToken(tokens.access_token);

			app.update((s) => ({ ...s, phase: "saving_keys" }));
			await storeEnvKeys(
				{ prodKey: data.prodKey, sandboxKey: data.sandboxKey },
				{ forceOverwrite: true },
			);

			const org = await fetchOrganizationMe({ secretKey: data.sandboxKey });
			app.update((s) => ({
				...s,
				phase: "complete",
				orgInfo: { name: org.name, slug: org.slug },
			}));

			setTimeout(() => {
				app.stop();
				opts?.onComplete?.();
			}, 1500);
		} catch (err) {
			app.update((s) => ({
				...s,
				phase: "error",
				error: err instanceof Error ? err.message : "Authentication failed",
			}));
			setTimeout(() => app.stop(), 2000);
		}
	};

	await app.start();

	// Step 1: Check existing auth
	try {
		const existingKey = readFromEnv({ bypass: true });
		if (existingKey) {
			app.update((s) => ({ ...s, phase: "confirm_reauth" }));
		} else {
			app.update((s) => ({ ...s, phase: "opening_browser" }));
			await runOAuth();
		}
	} catch {
		app.update((s) => ({ ...s, phase: "opening_browser" }));
		await runOAuth();
	}
}
