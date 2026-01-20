import { AutumnError } from "@/utils/error";
import type { AutumnPromise } from "@/utils/response";
import type { CustomerData, Plan } from "@useautumn/sdk/resources/shared";
import type { CustomerCreateParams } from "@useautumn/sdk/resources/customers";
import type { EventListResponse, EventAggregateResponse } from "@useautumn/sdk/resources/events";
import type { IAutumnClient } from "./ReactAutumnClient";
import type {
	EventAggregationParams,
	EventsListParams,
} from "./types/clientAnalyticsTypes";

export interface ErrorResponse {
	message: string;
	code: string;
}

export type OmitCustomerType =
	| "id"
	| "name"
	| "email"
	| "fingerprint"
	| "customer_id";

export interface ConvexAutumnClientConfig {
	convexApi: any; // The exported autumn.api() object from Convex
	// convexUrl: string; // The Convex deployment URL
	customerData?: CustomerData;
	headers?: Record<string, string>;
	getBearerToken?: () => Promise<string | null>;
	convex: any;
	suppressLogs?: boolean; // Suppress error logging to browser console
}

export class ConvexAutumnClient implements IAutumnClient {
	protected readonly convexApi: any;
	protected readonly convex: any;
	// protected readonly convexClient: ConvexHttpClient;
	public readonly customerData?: CustomerData;
	public readonly headers?: Record<string, string>;
	public readonly backendUrl?: string = undefined;
	public readonly prefix: string = "/api/convex";
	public readonly getBearerToken?: () => Promise<string | null>;
	public readonly suppressLogs: boolean;

	// Stub implementations for HTTP-specific methods that the interface requires
	async detectCors() {
		return {
			valid: true,
			includeCredentials: false as boolean | undefined,
		};
	}

	async shouldIncludeCredentials(): Promise<boolean> {
		return false;
	}

	async getHeaders() {
		return { "Content-Type": "application/json" };
	}

	async handleFetch() {
		throw new Error("HTTP methods not supported in Convex mode");
	}

	async post() {
		throw new Error("HTTP methods not supported in Convex mode");
	}

	async get() {
		throw new Error("HTTP methods not supported in Convex mode");
	}

	async delete() {
		throw new Error("HTTP methods not supported in Convex mode");
	}

	constructor({
		convexApi,
		customerData,
		headers,
		getBearerToken,
		convex,
		suppressLogs,
	}: ConvexAutumnClientConfig) {
		this.convex = convex;
		this.convexApi = convexApi;
		// this.convexClient = new ConvexHttpClient(convexUrl);
		this.getBearerToken = getBearerToken;
		this.customerData = customerData;
		this.headers = headers;
		this.suppressLogs = suppressLogs ?? false;
	}

	async createCustomer(
		params: Omit<CustomerCreateParams, "id" | "data"> & {
			errorOnNotFound?: boolean;
		},
	) {
		try {
			const result = await this.convex.action(
				this.convexApi.createCustomer,
				params,
			);

			return result;
		} catch (error: any) {
			return {
				data: null,
				error: new AutumnError({
					message: error.message,
					code: "convex_action_failed",
				}),
			};
		}
	}

	// Core methods that wrap Convex actions
	attach = async (args: any) => {
		try {
			// Filter out frontend-only parameters
			const { dialog, openInNewTab, ...backendArgs } = args;

			const result = await this.convex.action(
				this.convexApi.attach,
				backendArgs,
			);

			return result;
		} catch (error: any) {
			return {
				data: null,
				error: new AutumnError({
					message: error.message,
					code: "convex_action_failed",
				}),
			};
		}
	};

	checkout = async (args: any) => {
		try {
			// Filter out frontend-only parameters
			const { dialog, openInNewTab, ...backendArgs } = args;

			const result = await this.convex.action(
				this.convexApi.checkout,
				backendArgs,
			);

			return result;
		} catch (error: any) {
			return {
				data: null,
				error: new AutumnError({
					message: error.message,
					code: "convex_action_failed",
				}),
			};
		}
	};

	cancel = async (args: any) => {
		try {
			const result = await this.convex.action(this.convexApi.cancel, args);
			return result;
		} catch (error: any) {
			return {
				data: null,
				error: new AutumnError({
					message: error.message,
					code: "convex_action_failed",
				}),
			};
		}
	};

	check = async (args: any) => {
		try {
			const result = await this.convex.action(this.convexApi.check, args);
			return result;
		} catch (error: any) {
			return {
				data: null,
				error: new AutumnError({
					message: error.message,
					code: "convex_action_failed",
				}),
			};
		}
	};

	track = async (args: any) => {
		try {
			const result = await this.convex.action(this.convexApi.track, args);
			return result;
		} catch (error: any) {
			return {
				data: null,
				error: new AutumnError({
					message: error.message,
					code: "convex_action_failed",
				}),
			};
		}
	};

	openBillingPortal = async (args: any) => {
		try {
			// Filter out frontend-only parameters
			const { openInNewTab, ...backendArgs } = args;

			const result = await this.convex.action(
				this.convexApi.billingPortal,
				backendArgs,
			);

			return result;
		} catch (error: any) {
			return {
				data: null,
				error: new AutumnError({
					message: error.message,
					code: "convex_action_failed",
				}),
			};
		}
	};

	setupPayment = async (args: any) => {
		try {
			const result = await this.convex.action(
				this.convexApi.setupPayment,
				args,
			);
			return result;
		} catch (error: any) {
			return {
				data: null,
				error: new AutumnError({
					message: error.message,
					code: "convex_action_failed",
				}),
			};
		}
	};

	query = async (args: any) => {
		try {
			const result = await this.convex.action(this.convexApi.query, args);
			return result;
		} catch (error: any) {
			return {
				data: null,
				error: new AutumnError({
					message: error.message,
					code: "convex_action_failed",
				}),
			};
		}
	};

	entities = {
		create: async (args: any) => {
			try {
				// Check if args is an array or single entity
				if (Array.isArray(args)) {
					// Multiple entities - use createEntities method
					throw new Error(
						"Passing an array of entities to createEntity() is not supported for Convex",
					);
					// const entityArgs = { entities: args };
					// const result = await this.convex.action(
					//   this.convexApi.createEntities,
					//   entityArgs
					// );
					// return result;
				} else {
					// Single entity - use createEntity method directly (no entities wrapper)
					const result = await this.convex.action(
						this.convexApi.createEntity,
						args,
					);
					return result;
				}
			} catch (error: any) {
				return {
					data: null,
					error: new AutumnError({
						message: error.message,
						code: "convex_action_failed",
					}),
				};
			}
		},

		get: async (entityId: string, args: any) => {
			try {
				const result = await this.convex.action(this.convexApi.getEntity, {
					entityId,
					...args,
				});

				return result;
			} catch (error: any) {
				if (!this.suppressLogs) {
					console.error("Error fetching entity: ", error);
				}
				return {
					data: null,
					error: new AutumnError({
						message: error.message,
						code: "convex_action_failed",
					}),
				};
			}
		},

		delete: async (args: any) => {
			try {
				// Set auth token for the request - backend will extract identity
				// 	if (this.getBearerToken) {
				// 	this.convexClient.setAuth(
				// 		(await this.getBearerToken()) ?? ""
				// 	);
				// }
				const result = await this.convex.action(
					this.convexApi.deleteEntity,
					args,
				);
				return result;
			} catch (error: any) {
				return {
					data: null,
					error: new AutumnError({
						message: error.message,
						code: "convex_action_failed",
					}),
				};
			}
		},
	};

	referrals = {
		createCode: async (args: any) => {
			try {
				const result = await this.convex.action(
					this.convexApi.createReferralCode,
					args,
				);
				return result;
			} catch (error: any) {
				return {
					data: null,
					error: new AutumnError({
						message: error.message,
						code: "convex_action_failed",
					}),
				};
			}
		},

		redeemCode: async (args: any) => {
			try {
				// Set auth token for the request - backend will extract identity
				// if (this.getBearerToken) {
				// 	this.convexClient.setAuth(
				// 		(await this.getBearerToken()) ?? ""
				// 	);
				// }
				const result = await this.convex.action(
					this.convexApi.redeemReferralCode,
					args,
				);
				return result;
			} catch (error: any) {
				return {
					data: null,
					error: new AutumnError({
						message: error.message,
						code: "convex_action_failed",
					}),
				};
			}
		},
	};

	products = {
		list: async (): AutumnPromise<{ list: Plan[] }> => {
			try {
				const result = await this.convex.action(
					this.convexApi.listProducts,
					{},
				);
				return result;
			} catch (error: any) {
				return {
					data: null,
					error: new AutumnError({
						message: error.message,
						code: "convex_action_failed",
					}),
				};
			}
		},
	};

	events = {
		list: async (
			params: EventsListParams,
		): AutumnPromise<EventListResponse> => {
			try {
				const result = await this.convex.action(
					this.convexApi.listEvents,
					params,
				);
				return result;
			} catch (error: any) {
				return {
					data: null,
					error: new AutumnError({
						message: error.message,
						code: "convex_action_failed",
					}),
				};
			}
		},

		aggregate: async (
			params: EventAggregationParams,
		): AutumnPromise<EventAggregateResponse> => {
			try {
				const result = await this.convex.action(
					this.convexApi.aggregateEvents,
					params,
				);
				return result;
			} catch (error: any) {
				return {
					data: null,
					error: new AutumnError({
						message: error.message,
						code: "convex_action_failed",
					}),
				};
			}
		},
	};
}
