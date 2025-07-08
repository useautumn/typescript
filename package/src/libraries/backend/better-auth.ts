import { createAuthEndpoint } from "better-auth/plugins";
import {
	type AuthContext,
	type BetterAuthClientPlugin,
	type BetterAuthPlugin,
	type Endpoint,
	type EndpointContext,
	type Method,
} from "better-auth";
import { createRouterWithOptions } from "./routes/backendRouter";
import { secretKeyCheck } from "./utils/secretKeyCheck";
import { Autumn, AutumnError, Customer } from "@sdk";
import { findRoute } from "rou3";
import { sessionMiddleware } from "better-auth/api";
import { z } from "zod";
import {
	attachParamsSchema,
	checkParamsSchema,
	trackParamsSchema,
	createReferralCodeParamsSchema,
	redeemReferralCodeParamsSchema,
	cancelParamsSchema,
	openBillingPortalParamsSchema,
} from "./schemas/zod";
import { AttachParamsSchema, CheckParamsNoDialogSchema, TrackParamsSchema, CancelParamsSchema } from "@/client/types/clientGenTypes";
import { atom } from "nanostores";
import { useAuthQuery } from "better-auth/client";
import { AllowedParams, handleAllowed } from "@/hooks/handleAllowed";
import { CreateReferralCodeParamsSchema, RedeemReferralCodeParamsSchema } from "@/client/types/clientReferralTypes";
import { toSnakeCase } from "@/utils/toSnakeCase";

const router = createRouterWithOptions();
const handleReq = async (ctx: EndpointContext<any, any, AuthContext>) => {
	let { found, error: resError } = secretKeyCheck();
	if (!found) {
		return ctx.json({ error: resError }, { status: resError!.statusCode });
	}

	const req = ctx.request as Request;
	const method = req.method;
	const url = new URL(req.url);
	const searchParams = Object.fromEntries(url.searchParams);
	let pathname = url.pathname;
	pathname = pathname.replace("/api/auth", "");

	const match = findRoute(router, method, pathname);

	if (!match) {
		return ctx.json({ error: "Not found" }, { status: 404 });
	}

	const { data, params: pathParams } = match;
	const { handler } = data;

	const body = ctx.body;
	const session = ctx.context.session;

	const identify = async () => {
		if (!session) {
			return;
		}
		return {
			customerId: session.user.id,
			customerData: {
				email: session.user.email,
				name: session.user.name,
			},
		};
	};

	const result = await handler({
		autumn,
		body,
		path: url,
		getCustomer: identify,
		pathParams,
		searchParams,
	});

	return ctx.json(result.body, { status: result.statusCode });
};

const createAutumnEndpoints = () => {
	let endpoints: Record<string, Endpoint> = {};
	for (const route of Object.keys(router.static)) {
		const methods = Object.keys(router.static[route]?.methods || {});

		let func = route.replace("/api/autumn/", "");
		func = func.replace(/\//g, "");
		func = func.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
		func = func.replace(/[-_]/g, "");

		for (const method of methods) {
			let methodFunc =
				method.toLowerCase() + func[0].toUpperCase() + func.slice(1);
			endpoints[methodFunc] = createAuthEndpoint(
				route,
				{
					method: method as Method,
					use: [sessionMiddleware],
				},
				async (ctx) => {
					console.log("handleReq", ctx, method, methodFunc);
					await handleReq(ctx);
				}
			) as Endpoint;
		}
	}

	return endpoints;
};

export const autumn = () =>
	({
		id: "autumn",
		endpoints: {
			attach: createAuthEndpoint(
				"/autumn/attach",
				{
					method: "POST",
					body: AttachParamsSchema,
					use: [sessionMiddleware],
				},
				async (ctx) => {
					const autumnApiClient = new Autumn({
						secretKey: process.env.AUTUMN_SECRET_KEY,
					});
					let res = await autumnApiClient.attach({
						...toSnakeCase(ctx.body),
						customer_id: ctx.context.session.user.id,
					})
					return res.error ? ctx.json(res.error, {
						status: res.statusCode
					}) : ctx.json(res.data, {
						status: res.statusCode
					})
				}
			),
			check: createAuthEndpoint(
				"/autumn/check",
				{
					method: "POST",
					body: CheckParamsNoDialogSchema,
					use: [sessionMiddleware],
				},
				async (ctx) => {
					const autumnApiClient = new Autumn({
						secretKey: process.env.AUTUMN_SECRET_KEY,
					});
					let res = await autumnApiClient.check({
						...toSnakeCase(ctx.body),
						customer_id: ctx.context.session.user.id,
					})
					return res.error ? ctx.json(res.error, {
						status: res.statusCode
					}) : ctx.json(res.data, {
						status: res.statusCode
					})
				}
			),
			track: createAuthEndpoint(
				"/autumn/track",
				{
					method: "POST",
					body: TrackParamsSchema,
					use: [sessionMiddleware],
				},
				async (ctx) => {
					const autumnApiClient = new Autumn({
						secretKey: process.env.AUTUMN_SECRET_KEY,
					});
					let res = await autumnApiClient.track({
						...toSnakeCase(ctx.body),
						customer_id: ctx.context.session.user.id,
					})
					return res.error ? ctx.json(res.error, {
						status: res.statusCode
					}) : ctx.json(res.data, {
						status: res.statusCode
					})
				}
			),
			cancel: createAuthEndpoint(
				"/autumn/cancel",
				{
					method: "POST",
					body: CancelParamsSchema,
					use: [sessionMiddleware],
				},
				async (ctx) => {
					const autumnApiClient = new Autumn({
						secretKey: process.env.AUTUMN_SECRET_KEY,
					});
					let res = await autumnApiClient.cancel({
						...toSnakeCase(ctx.body),
						customer_id: ctx.context.session.user.id,
					})
					return res.error ? ctx.json(res.error, {
						status: res.statusCode
					}) : ctx.json(res.data, {
						status: res.statusCode
					})
				}
			),
			createReferralCode: createAuthEndpoint(
				"/autumn/create-referral-code",
				{
					method: "POST",
					body: CreateReferralCodeParamsSchema,
					use: [sessionMiddleware],
				},
				async (ctx) => {
					const autumnApiClient = new Autumn({
						secretKey: process.env.AUTUMN_SECRET_KEY,
					});
					console.log("createReferralCode", ctx.body);
					let res = await autumnApiClient.referrals.createCode({
						...toSnakeCase(ctx.body),
						customer_id: ctx.context.session.user.id,
					})
					return res.error ? ctx.json(res.error, {
						status: res.statusCode
					}) : ctx.json(res.data, {
						status: res.statusCode
					})
				}
			),
			redeemReferralCode: createAuthEndpoint(
				"/autumn/redeem-referral-code",
				{
					method: "POST",
					body: RedeemReferralCodeParamsSchema,
					use: [sessionMiddleware],
				},
				async (ctx) => {
					const autumnApiClient = new Autumn({
						secretKey: process.env.AUTUMN_SECRET_KEY,
					});
					let res = await autumnApiClient.referrals.redeemCode({
						...toSnakeCase(ctx.body),
						customer_id: ctx.context.session.user.id,
					})
					return res.error ? ctx.json(res.error, {
						status: res.statusCode
					}) : ctx.json(res.data, {
						status: res.statusCode
					})
				}
			),
			listProducts: createAuthEndpoint(
				"/autumn/list-products",
				{
					method: "GET",
					use: [sessionMiddleware],
				},
				async (ctx) => {
					const autumnApiClient = new Autumn({
						secretKey: process.env.AUTUMN_SECRET_KEY,
					});
					let res = await autumnApiClient.products.list()
					return res.error ? ctx.json(res.error, {
						status: res.statusCode
					}) : ctx.json(res.data, {
						status: res.statusCode
					})
				}
			),

			// Interals:
			allowed: createAuthEndpoint(
				"/autumn/allowed",
				{
					method: "POST",
					metadata: {
						isAction: false,
					},
					body: z.object({
						featureId: z.string().optional(),
						productId: z.string().optional(),
						requiredBalance: z.number().optional(),
					}),
					use: [sessionMiddleware],
				},
				async (ctx) => {}
			),

			"fetch-customer": createAuthEndpoint(
				"/autumn/fetch-customer",
				{
					method: "GET",
					metadata: {
						isAction: false,
					},
					use: [sessionMiddleware],
				},
				async (ctx) => {
					const autumnApiClient = new Autumn({
						secretKey: process.env.AUTUMN_SECRET_KEY,
					});
					
					let res = await autumnApiClient.customers.create({
						id: ctx.context.session.user.id,
						email: ctx.context.session.user.email,
						name: ctx.context.session.user.name,
					})

					return res.error ? ctx.json(res.error, {
						status: res.statusCode
					}) : ctx.json(res.data, {
						status: res.statusCode
					})
				}
			),

			getBillingPortal: createAuthEndpoint(
				"/autumn/get-billing-portal",
				{
					method: "POST",
					body: z
						.object({
							returnUrl: z.string().optional(),
						})
						.optional(),
					metadata: {
						isAction: false,
					},
					use: [sessionMiddleware],
				},
				async (ctx) => {
					const autumnApiClient = new Autumn({
						secretKey: process.env.AUTUMN_SECRET_KEY,
					});

					let res = await autumnApiClient.customers.billingPortal(
						ctx.context.session.user.id,
						{
							return_url: ctx.body?.returnUrl ?? undefined,
						}
					)

					return res.error ? ctx.json(res.error, {
						status: res.statusCode
					}) : ctx.json(res.data, {
						status: res.statusCode
					})
				}
			),
		},
	}) satisfies BetterAuthPlugin;

export const autumnClient = () =>
	({
		id: "autumn",
		$InferServerPlugin: {} as ReturnType<typeof autumn>,
		getActions: ($fetch, $store) => {
			return {
				autumn: {
					getBillingPortal: (returnUrl?: string) => {
						return $fetch("/autumn/get-billing-portal", {
							method: "POST",
							body: {
								returnUrl: returnUrl ?? undefined,
							},
						});
					},
				},

				allowed: (params: AllowedParams) => {
					const customerAtom = $store.atoms.customer;
					const customerData = customerAtom.get();

					console.log("customerData", customerData);
					if (customerData.isPending) {
						return false;
					}

					if (customerData.error || customerData.data?.error) {
						return false;
					}

					return handleAllowed({
						customer: customerData.data.data as Customer,
						params,
					});
				},

				// Trigger refetch when needed
				refetchCustomer: () => {
					$store.notify("$customerSignal");
				},
			};
		},
		getAtoms: ($fetch) => {
			const $customerSignal = atom<boolean>(false);

			const customer = useAuthQuery<Customer | AutumnError>(
				$customerSignal,
				"/autumn/fetch-customer",
				$fetch,
				{
					method: "GET",
				}
			);

			return {
				customer,
				$customerSignal,
			};
		},
	}) satisfies BetterAuthClientPlugin;
