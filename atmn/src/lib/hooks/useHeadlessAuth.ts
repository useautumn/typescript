import { useCallback, useEffect, useRef, useState } from "react";
import { getOrgMe } from "../../../source/core/requests/orgRequests.js";
import { readFromEnv, storeToEnv } from "../../../source/core/utils.js";
import { CLI_CLIENT_ID } from "../../commands/auth/constants.js";
import {
	getApiKeysWithToken,
	startOAuthFlow,
} from "../../commands/auth/oauth.js";

interface OrgInfo {
	name: string;
	slug: string;
}

type AuthState = "checking" | "waiting" | "authenticated" | "error";

export function useHeadlessAuth(): {
	authState: AuthState;
	orgInfo: OrgInfo | null;
	error: string | null;
} {
	const [authState, setAuthState] = useState<AuthState>("checking");
	const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
	const [error, setError] = useState<string | null>(null);
	const hasStarted = useRef(false);

	const performAuth = useCallback(async () => {
		setAuthState("waiting");

		try {
			const { tokens } = await startOAuthFlow(CLI_CLIENT_ID, {
				headless: true,
			});
			const { sandboxKey, prodKey } = await getApiKeysWithToken(
				tokens.access_token,
			);

			await storeToEnv(prodKey, sandboxKey);

			// Fetch org info with new key
			const info = await getOrgMe();
			setOrgInfo(info);
			setAuthState("authenticated");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Authentication failed");
			setAuthState("error");
		}
	}, []);

	useEffect(() => {
		if (hasStarted.current) return;
		hasStarted.current = true;

		const checkAuth = async () => {
			try {
				const apiKey = readFromEnv({ bypass: true });

				if (!apiKey) {
					await performAuth();
					return;
				}

				// Verify the key works by fetching org info
				const info = await getOrgMe();
				setOrgInfo(info);
				setAuthState("authenticated");
			} catch {
				// Key exists but is invalid
				await performAuth();
			}
		};

		checkAuth();
	}, [performAuth]);

	return { authState, orgInfo, error };
}
