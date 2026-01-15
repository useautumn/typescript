import * as http from "node:http";
import * as arctic from "arctic";
import open from "open";
import { BACKEND_URL } from "../../../source/constants.js";
import {
	getErrorHtml,
	getSuccessHtml,
} from "../../views/html/oauth-callback.js";
import { getOAuthRedirectUri, OAUTH_PORTS } from "./constants.js";

const AUTHORIZATION_ENDPOINT = `${BACKEND_URL}/api/auth/oauth2/authorize`;
const TOKEN_ENDPOINT = `${BACKEND_URL}/api/auth/oauth2/token`;

export interface OAuthResult {
	tokens: {
		access_token: string;
		token_type: string;
		expires_in?: number;
		refresh_token?: string;
	};
}

export interface StartOAuthOptions {
	headless?: boolean;
}

type CallbackResult = { html: string; result?: OAuthResult; error?: Error };

/** Start a one-shot HTTP server, returns null if port in use */
async function startCallbackServer(
	port: number,
	onCallback: (url: URL) => Promise<CallbackResult>,
	onListening: () => void,
): Promise<OAuthResult | null> {
	return new Promise((resolve, reject) => {
		const server = http.createServer(async (req, res) => {
			const url = new URL(req.url || "/", `http://localhost:${port}`);
			if (url.pathname !== "/") {
				res.writeHead(404).end("Not found");
				return;
			}

			const { html, result, error } = await onCallback(url);
			res.writeHead(200, { "Content-Type": "text/html" }).end(html);
			clearTimeout(timeoutId);
			server.close();
			if (error) {
				reject(error);
			} else if (result) {
				resolve(result);
			} else {
				reject(new Error("Unexpected callback state: no result or error"));
			}
		});

		const timeoutId = setTimeout(
			() => {
				server.close();
				reject(new Error("Authorization timed out. Please try again."));
			},
			5 * 60 * 1000,
		);

		server.once("error", (err: NodeJS.ErrnoException) => {
			err.code === "EADDRINUSE" ? resolve(null) : reject(err);
		});

		server.listen(port, onListening);
	});
}

/** Start OAuth flow and wait for callback */
export async function startOAuthFlow(
	clientId: string,
	options?: StartOAuthOptions,
): Promise<OAuthResult> {
	const codeVerifier = arctic.generateCodeVerifier();
	const state = arctic.generateState();

	for (const port of OAUTH_PORTS) {
		const redirectUri = getOAuthRedirectUri(port);
		const client = new arctic.OAuth2Client(clientId, null, redirectUri);

		const authUrl = client.createAuthorizationURLWithPKCE(
			AUTHORIZATION_ENDPOINT,
			state,
			arctic.CodeChallengeMethod.S256,
			codeVerifier,
			[
				"organisation:read",
				"customers:create",
				"customers:read",
				"customers:list",
				"customers:update",
				"customers:delete",
				"features:create",
				"features:read",
				"features:list",
				"features:update",
				"features:delete",
				"plans:create",
				"plans:read",
				"plans:list",
				"plans:update",
				"plans:delete",
				"apiKeys:create",
				"apiKeys:read",
			],
		);
		authUrl.searchParams.set("prompt", "consent");

		const result = await startCallbackServer(
			port,
			async (url) => {
				const error = url.searchParams.get("error");
				const errorDesc = url.searchParams.get("error_description");
				if (error) {
					return {
						html: getErrorHtml(errorDesc || error),
						error: new Error(errorDesc || error),
					};
				}

				if (url.searchParams.get("state") !== state) {
					return {
						html: getErrorHtml("Invalid state"),
						error: new Error("Invalid state - possible CSRF"),
					};
				}

				const code = url.searchParams.get("code");
				if (!code) {
					return {
						html: getErrorHtml("Missing code"),
						error: new Error("Missing authorization code"),
					};
				}

				try {
					const tokens = await client.validateAuthorizationCode(
						TOKEN_ENDPOINT,
						code,
						codeVerifier,
					);
					return {
						html: getSuccessHtml(),
						result: {
							tokens: {
								access_token: tokens.accessToken(),
								token_type: "Bearer",
								expires_in: tokens.accessTokenExpiresInSeconds(),
								refresh_token: tokens.hasRefreshToken()
									? tokens.refreshToken()
									: undefined,
							},
						},
					};
				} catch (err) {
					const msg =
						err instanceof arctic.OAuth2RequestError
							? `OAuth error: ${err.code}`
							: "Token exchange failed";
					return { html: getErrorHtml(msg), error: new Error(msg) };
				}
			},
			() => {
			if (options?.headless) {
				console.log(`\nVisit this URL to authenticate:\n\n  ${authUrl.toString()}\n`);
			} else {
				open(authUrl.toString());
			}
		}, // Open browser once server is listening
		);

		if (result) return result;
		// Port was in use, try next
	}

	throw new Error(
		`All OAuth ports (${OAUTH_PORTS[0]}-${OAUTH_PORTS[OAUTH_PORTS.length - 1]}) are in use.`,
	);
}

/** Get or create API keys using the OAuth access token */
export async function getApiKeysWithToken(
	accessToken: string,
): Promise<{ sandboxKey: string; prodKey: string; orgId: string }> {
	const response = await fetch(`${BACKEND_URL}/cli/api-keys`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || "Failed to create API keys");
	}

	const data = await response.json();
	return {
		sandboxKey: data.sandbox_key,
		prodKey: data.prod_key,
		orgId: data.org_id,
	};
}
