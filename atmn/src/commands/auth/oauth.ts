import * as http from "node:http";
import * as crypto from "node:crypto";
import open from "open";
import { BACKEND_URL } from "../../../source/constants.js";
import { OAUTH_PORTS, getOAuthRedirectUri } from "./constants.js";
import { getSuccessHtml, getErrorHtml } from "../../views/html/oauth-callback.js";

// Generate PKCE code verifier (43-128 chars, URL safe)
function generateCodeVerifier(): string {
	const array = crypto.randomBytes(32);
	return array
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");
}

// Generate PKCE code challenge from verifier (S256 method)
async function generateCodeChallenge(verifier: string): Promise<string> {
	const hash = crypto.createHash("sha256").update(verifier).digest();
	return hash
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "");
}

export interface OAuthTokens {
	access_token: string;
	token_type: string;
	expires_in?: number;
	refresh_token?: string;
	scope?: string;
	id_token?: string;
}

// Exchange authorization code for tokens
async function exchangeCodeForTokens(
	code: string,
	codeVerifier: string,
	clientId: string,
	redirectUri: string,
): Promise<OAuthTokens> {
	const params = new URLSearchParams({
		grant_type: "authorization_code",
		code,
		redirect_uri: redirectUri,
		client_id: clientId,
		code_verifier: codeVerifier,
	});

	const response = await fetch(`${BACKEND_URL}/api/auth/oauth2/token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params.toString(),
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(
			error.error_description || error.error || "Token exchange failed",
		);
	}

	return response.json();
}

export interface OAuthResult {
	tokens: OAuthTokens;
	orgId?: string;
}

/** Try to start a server on the given port, returns true if successful */
function tryListenOnPort(server: http.Server, port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const onError = (err: NodeJS.ErrnoException) => {
			if (err.code === "EADDRINUSE") {
				resolve(false);
			} else {
				resolve(false);
			}
		};

		server.once("error", onError);
		server.listen(port, () => {
			server.removeListener("error", onError);
			resolve(true);
		});
	});
}

// Symbol to indicate port was in use (not an error)
const PORT_IN_USE = Symbol("PORT_IN_USE");

/** Start OAuth flow and wait for callback */
export async function startOAuthFlow(clientId: string): Promise<OAuthResult> {
	const codeVerifier = generateCodeVerifier();
	const codeChallenge = await generateCodeChallenge(codeVerifier);

	// Try each port in sequence until one works
	for (const port of OAUTH_PORTS) {
		const result = await tryOAuthFlowOnPort(
			clientId,
			codeVerifier,
			codeChallenge,
			port,
		);

		if (result === PORT_IN_USE) {
			// Try next port
			continue;
		}

		// Success or error (not port-in-use)
		return result;
	}

	// All ports failed
	throw new Error(
		`All OAuth ports (${OAUTH_PORTS[0]}-${OAUTH_PORTS[OAUTH_PORTS.length - 1]}) are in use. ` +
			`Please close any other applications using these ports.`,
	);
}

/** Try to run OAuth flow on a specific port */
async function tryOAuthFlowOnPort(
	clientId: string,
	codeVerifier: string,
	codeChallenge: string,
	port: number,
): Promise<OAuthResult | typeof PORT_IN_USE> {
	const redirectUri = getOAuthRedirectUri(port);

	return new Promise((resolve, reject) => {
		let timeoutId: ReturnType<typeof setTimeout>;

		// Create local server to receive callback
		const server = http.createServer(async (req, res) => {
			const url = new URL(req.url || "/", `http://localhost:${port}`);

			if (url.pathname === "/") {
				const code = url.searchParams.get("code");
				const error = url.searchParams.get("error");
				const errorDescription = url.searchParams.get("error_description");

				if (error) {
					res.writeHead(200, { "Content-Type": "text/html" });
					res.end(getErrorHtml(errorDescription || error));
					clearTimeout(timeoutId);
					server.close();
					reject(new Error(errorDescription || error));
					return;
				}

				if (code) {
					res.writeHead(200, { "Content-Type": "text/html" });
					res.end(getSuccessHtml());

					clearTimeout(timeoutId);
					server.close();

					try {
						const tokens = await exchangeCodeForTokens(
							code,
							codeVerifier,
							clientId,
							redirectUri,
						);
						resolve({ tokens });
					} catch (err) {
						reject(err);
					}
					return;
				}

				res.writeHead(400, { "Content-Type": "text/plain" });
				res.end("Missing authorization code");
			} else {
				res.writeHead(404, { "Content-Type": "text/plain" });
				res.end("Not found");
			}
		});

		// Try to listen on the port
		tryListenOnPort(server, port).then((success) => {
			if (!success) {
				resolve(PORT_IN_USE);
				return;
			}

			// Server started, open browser
			const params = new URLSearchParams({
				client_id: clientId,
				response_type: "code",
				redirect_uri: redirectUri,
				scope: "openid profile email",
				code_challenge: codeChallenge,
				code_challenge_method: "S256",
				prompt: "consent",
			});

			const authUrl = `${BACKEND_URL}/api/auth/oauth2/authorize?${params.toString()}`;
			open(authUrl);

			// Timeout after 5 minutes
			timeoutId = setTimeout(() => {
				server.close();
				reject(new Error("Authorization timed out. Please try again."));
			}, 5 * 60 * 1000);
		});
	});
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
		const error = await response.json().catch(() => ({ error: "Unknown error" }));
		throw new Error(error.error || "Failed to create API keys");
	}

	const data = await response.json();
	return {
		sandboxKey: data.sandbox_key,
		prodKey: data.prod_key,
		orgId: data.org_id,
	};
}
