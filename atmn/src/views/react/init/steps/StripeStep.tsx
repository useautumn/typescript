import { Box, Text } from "ink";
import open from "open";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FRONTEND_URL } from "../../../../constants.js";
import { externalRequest } from "../../../../../source/core/api.js";
import { StatusLine, StepHeader } from "../../components/index.js";

type StripeState =
	| "pending"
	| "checking"
	| "not_connected"
	| "connecting"
	| "connected"
	| "error";

interface StripeStepProps {
	step: number;
	totalSteps: number;
	onComplete: () => void;
}

export function StripeStep({ step, totalSteps, onComplete }: StripeStepProps) {
	const [stripeState, setStripeState] = useState<StripeState>("pending");
	const [stripeError, setStripeError] = useState<string | null>(null);
	const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const connectStripe = useCallback(async () => {
		setStripeState("connecting");

		// Open dashboard to Stripe connect page
		const stripeConnectUrl = `${FRONTEND_URL}/dev?tab=stripe`;
		await open(stripeConnectUrl);

		// Poll for Stripe connection
		const maxAttempts = 60; // 5 minutes with 5 second intervals
		let attempts = 0;

		const pollInterval = setInterval(async () => {
			attempts++;

			try {
				const orgDetails = (await externalRequest({
					method: "GET",
					path: "/organization",
					throwOnError: true,
				})) as { stripe_connection?: string };

				if (
					orgDetails.stripe_connection &&
					orgDetails.stripe_connection !== "none"
				) {
					if (pollIntervalRef.current) {
						clearInterval(pollIntervalRef.current);
						pollIntervalRef.current = null;
					}
					setStripeState("connected");
					onComplete();
				} else if (attempts >= maxAttempts) {
					if (pollIntervalRef.current) {
						clearInterval(pollIntervalRef.current);
						pollIntervalRef.current = null;
					}
					setStripeError("Timed out waiting for Stripe connection");
					setStripeState("error");
				}
			} catch {
				// Continue polling on error
			}
		}, 5000);

		pollIntervalRef.current = pollInterval;
	}, [onComplete]);

	const checkStripe = useCallback(async () => {
		setStripeState("checking");

		try {
			// Fetch org details to check Stripe connection
			const orgDetails = (await externalRequest({
				method: "GET",
				path: "/organization",
				throwOnError: true,
			})) as { stripe_connection?: string };

			if (
				orgDetails.stripe_connection &&
				orgDetails.stripe_connection !== "none"
			) {
				setStripeState("connected");
				onComplete();
			} else {
				setStripeState("not_connected");
				// Auto-open Stripe connect page
				await connectStripe();
			}
		} catch (error) {
			setStripeError(
				error instanceof Error
					? error.message
					: "Failed to check Stripe status",
			);
			setStripeState("error");
		}
	}, [connectStripe, onComplete]);

	useEffect(() => {
		// Only start checking when this step is active
		if (stripeState === "pending") {
			checkStripe();
		}
	}, [checkStripe, stripeState]);

	// Cleanup: clear poll interval on unmount
	useEffect(() => {
		return () => {
			if (pollIntervalRef.current) {
				clearInterval(pollIntervalRef.current);
				pollIntervalRef.current = null;
			}
		};
	}, []);

	return (
		<Box flexDirection="column" marginBottom={1}>
			<StepHeader step={step} totalSteps={totalSteps} title="Stripe Connection" />
			{stripeState === "checking" && (
				<StatusLine status="loading" message="Checking Stripe connection..." />
			)}
			{stripeState === "not_connected" && (
				<StatusLine status="loading" message="Opening Stripe Connect..." />
			)}
			{stripeState === "connecting" && (
				<Box flexDirection="column">
					<StatusLine
						status="loading"
						message="Waiting for Stripe connection..."
					/>
					<Text dimColor>
						{" "}
						Complete the setup in your browser, then return here.
					</Text>
				</Box>
			)}

			{stripeState === "connected" && (
				<StatusLine status="success" message="Stripe connected" />
			)}

			{stripeState === "error" && (
				<StatusLine
					status="error"
					message={stripeError || "Stripe connection failed"}
				/>
			)}
		</Box>
	);
}
