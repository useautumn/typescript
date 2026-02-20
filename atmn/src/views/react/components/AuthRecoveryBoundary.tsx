// biome-ignore lint/style/useImportType: needed for react
import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import {
	type AuthRecoveryPhase,
	isAuthError,
	useAuthRecovery,
} from "../../../lib/hooks/useAuthRecovery.js";
import { Card } from "./Card.js";
import { LoadingText } from "./LoadingText.js";
import { CardWidthProvider } from "./providers/CardWidthContext.js";

// Auth URL for fallback display
const _AUTH_URL = "https://app.useautumn.com/cli-auth";

interface AuthRecoveryContextValue {
	/** Check if an error is a 401 that should trigger recovery */
	isAuthError: (error: unknown) => boolean;
	/** Handle an error - if it's a 401, start recovery */
	handleError: (error: unknown) => boolean;
	/** Whether auth recovery is currently in progress */
	isRecovering: boolean;
	/** Current phase of recovery */
	phase: AuthRecoveryPhase;
}

const AuthRecoveryContext = createContext<AuthRecoveryContextValue | null>(
	null,
);

/**
 * Hook to access auth recovery context
 */
export function useAuthRecoveryContext(): AuthRecoveryContextValue {
	const context = useContext(AuthRecoveryContext);
	if (!context) {
		throw new Error(
			"useAuthRecoveryContext must be used within AuthRecoveryBoundary",
		);
	}
	return context;
}

interface AuthRecoveryBoundaryProps {
	children?: React.ReactNode;
	/** Called when the original command should be retried after successful auth */
	onRetry?: () => void;
}

/**
 * Boundary component that catches 401 errors and shows auth recovery UI
 *
 * Wrap your command views with this to automatically handle expired/invalid auth:
 *
 * ```tsx
 * <AuthRecoveryBoundary onRetry={() => refetch()}>
 *   <PushView />
 * </AuthRecoveryBoundary>
 * ```
 */
export function AuthRecoveryBoundary({
	children,
	onRetry,
}: AuthRecoveryBoundaryProps) {
	const [shouldShowRecovery, setShouldShowRecovery] = useState(false);

	const authRecovery = useAuthRecovery({
		onRecovered: () => {
			// Auth recovered, hide recovery UI and retry original command
			setShouldShowRecovery(false);
			if (onRetry) {
				onRetry();
			}
		},
		onFailed: () => {
			// Keep showing recovery UI with error state
		},
	});

	const handleError = useCallback(
		(error: unknown): boolean => {
			if (isAuthError(error)) {
				setShouldShowRecovery(true);
				authRecovery.startRecovery();
				return true;
			}
			return false;
		},
		[authRecovery],
	);

	// Start recovery when shouldShowRecovery becomes true
	useEffect(() => {
		if (shouldShowRecovery && authRecovery.phase === "idle") {
			authRecovery.startRecovery();
		}
	}, [shouldShowRecovery, authRecovery]);

	const contextValue: AuthRecoveryContextValue = {
		isAuthError,
		handleError,
		isRecovering: authRecovery.isRecovering,
		phase: authRecovery.phase,
	};

	// Show recovery UI if in recovery mode
	if (shouldShowRecovery) {
		return (
			<AuthRecoveryContext.Provider value={contextValue}>
				<AuthRecoveryView
					phase={authRecovery.phase}
					error={authRecovery.error}
				/>
			</AuthRecoveryContext.Provider>
		);
	}

	return (
		<AuthRecoveryContext.Provider value={contextValue}>
			{children}
		</AuthRecoveryContext.Provider>
	);
}

interface AuthRecoveryViewProps {
	phase: AuthRecoveryPhase;
	error: string | null;
}

/**
 * UI shown during auth recovery
 */
function AuthRecoveryView({ phase, error }: AuthRecoveryViewProps) {
	return (
		<CardWidthProvider>
			<box flexDirection="column" marginBottom={1}>
				{/* Header */}
				<Card title="🔐 Session Expired">
					<text content="Your authentication has expired or is invalid." />
					<text
						content="Please re-authenticate to continue."
						style={{ fg: "#888888" }}
					/>
				</Card>

				{/* Browser phases */}
				{(phase === "detected" ||
					phase === "opening_browser" ||
					phase === "waiting_auth") && (
					<Card title="🌐 Browser">
						<LoadingText
							text={
								phase === "detected"
									? "Preparing authentication..."
									: phase === "opening_browser"
										? "Opening browser..."
										: "Waiting for authentication..."
							}
						/>
					</Card>
				)}

				{/* Creating keys */}
				{phase === "creating_keys" && (
					<Card title="🔑 API Keys">
						<LoadingText text="Creating API keys..." />
					</Card>
				)}

				{/* Saving keys */}
				{phase === "saving_keys" && (
					<Card title="🔑 API Keys">
						<LoadingText text="Saving keys to .env..." />
					</Card>
				)}

				{/* Complete */}
				{phase === "complete" && (
					<Card title="✓ Re-authenticated">
						<text
							content="Authentication successful!"
							style={{ fg: "green" }}
						/>
						<text
							content="Resuming your previous command..."
							style={{ fg: "#888888" }}
						/>
					</Card>
				)}

				{/* Error */}
				{phase === "error" && (
					<Card title="✗ Authentication Failed">
						<text
							content={error || "An unknown error occurred."}
							style={{ fg: "red" }}
						/>
						<box marginTop={1}>
							<text
								content="Please try again with `atmn login`."
								style={{ fg: "#888888" }}
							/>
						</box>
					</Card>
				)}
			</box>
		</CardWidthProvider>
	);
}

export { isAuthError };
