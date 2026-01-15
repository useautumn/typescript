import { Box } from "ink";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { getOrgMe } from "../../../../../source/core/requests/orgRequests.js";
import { readFromEnv, storeToEnv } from "../../../../../source/core/utils.js";
import { CLI_CLIENT_ID } from "../../../../commands/auth/constants.js";
import {
	getApiKeysWithToken,
	startOAuthFlow,
} from "../../../../commands/auth/oauth.js";
import { StatusLine, StepHeader } from "../../components/index.js";

interface OrgInfo {
	name: string;
	slug: string;
}

type AuthState =
	| "checking"
	| "not_authenticated"
	| "authenticating"
	| "authenticated"
	| "error";

interface AuthStepProps {
	step: number;
	totalSteps: number;
	onComplete: (orgInfo: OrgInfo) => void;
}

export function AuthStep({ step, totalSteps, onComplete }: AuthStepProps) {
	const [authState, setAuthState] = useState<AuthState>("checking");
	const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
	const [authError, setAuthError] = useState<string | null>(null);
	const hasCheckedAuth = useRef(false);
	const isCompleted = useRef(false);

	const startAuth = useCallback(async () => {
		setAuthState("authenticating");

		try {
			const { tokens } = await startOAuthFlow(CLI_CLIENT_ID);
			const { sandboxKey, prodKey } = await getApiKeysWithToken(
				tokens.access_token,
			);

			await storeToEnv(prodKey, sandboxKey);

			// Fetch org info with new key
			const info = await getOrgMe();
			setOrgInfo(info);
			setAuthState("authenticated");

			if (!isCompleted.current) {
				isCompleted.current = true;
				onComplete(info);
			}
		} catch (error) {
			setAuthError(
				error instanceof Error ? error.message : "Authentication failed",
			);
			setAuthState("error");
		}
	}, [onComplete]);

	const checkAuth = useCallback(async () => {
		setAuthState("checking");

		try {
			const apiKey = readFromEnv({ bypass: true });

			if (!apiKey) {
				setAuthState("not_authenticated");
				await startAuth();
				return;
			}

			// Verify the key works by fetching org info
			const info = await getOrgMe();
			setOrgInfo(info);
			setAuthState("authenticated");

			if (!isCompleted.current) {
				isCompleted.current = true;
				onComplete(info);
			}
		} catch {
			// Key exists but is invalid
			setAuthState("not_authenticated");
			await startAuth();
		}
	}, [startAuth, onComplete]);

	useEffect(() => {
		// Only run the auth check once on mount
		if (!hasCheckedAuth.current) {
			hasCheckedAuth.current = true;
			checkAuth();
		}
	}, [checkAuth]);

	return (
		<Box flexDirection="column" marginBottom={1}>
			<StepHeader step={step} totalSteps={totalSteps} title="Authentication" />
			{authState === "checking" && (
				<StatusLine status="loading" message="Checking authentication..." />
			)}
			{authState === "not_authenticated" && (
				<StatusLine status="loading" message="Opening browser for login..." />
			)}
			{authState === "authenticating" && (
				<StatusLine status="loading" message="Waiting for authentication..." />
			)}
			{authState === "authenticated" && orgInfo && (
				<StatusLine
					status="success"
					message={`Logged in as ${orgInfo.name}`}
					detail={orgInfo.slug}
				/>
			)}
			{authState === "error" && (
				<StatusLine
					status="error"
					message={authError || "Authentication failed"}
				/>
			)}
		</Box>
	);
}
