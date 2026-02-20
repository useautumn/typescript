interface ApiError {
	status?: number;
	response?: { status?: number };
}

/**
 * Check if an error is a 401 authentication error
 */
export function isAuthError(error: unknown): boolean {
	if (!error || typeof error !== "object") return false;
	const apiError = error as ApiError;
	return apiError.status === 401;
}
