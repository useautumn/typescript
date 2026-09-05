"use node";

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { componentsGeneric } from "convex/server";
import { Autumn, type AutumnComponent } from "./index.js";

const components = componentsGeneric() as unknown as {
  autumn: AutumnComponent;
};

/**
 * How the server ends a response whose status line is already on the wire.
 *
 * `truncated` closes the connection after announcing more body than it sends,
 * and `stalled` sends nothing further at all. A mocked `fetch` cannot produce
 * either one: both need a real socket that carries the status before the body
 * fails.
 */
export type BodyBehavior = "complete" | "truncated" | "stalled";

export type ResponsePlan = {
  status: number;
  body: BodyBehavior;
};

const plan: ResponsePlan = { status: 200, body: "complete" };
let received = 0;

/** Set what the server answers next and forget earlier requests. */
export function planResponse(next: ResponsePlan): void {
  plan.status = next.status;
  plan.body = next.body;
  received = 0;
}

export function requestCount(): number {
  return received;
}

function handle(request: IncomingMessage, response: ServerResponse): void {
  received += 1;
  request.resume();
  const body = JSON.stringify(
    plan.status >= 200 && plan.status < 300
      ? { customer_id: "customer-1", value: 1, balance: null }
      : { message: "provider failure" }
  );
  // Read once, because the callback below outlives the turn that plans the next
  // response.
  const behavior = plan.body;
  response.writeHead(plan.status, {
    "content-type": "application/json",
    // An announced length the body never reaches is what makes the client read
    // past the end of a response the server has already committed to.
    "content-length":
      Buffer.byteLength(body) + (behavior === "complete" ? 0 : 64),
  });
  if (behavior === "complete") {
    response.end(body);
    return;
  }
  response.write(body.slice(0, 8), () => {
    // Ending the socket only once the partial body has been flushed keeps the
    // status and the incomplete body ahead of the close on the wire.
    if (behavior === "truncated") response.socket?.end();
  });
}

const server = createServer(handle);
server.listen(0, "127.0.0.1");
await once(server, "listening");
const serverURL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

export async function closeResponseServer(): Promise<void> {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function client(timeoutMs?: number) {
  return new Autumn(components.autumn, {
    secretKey: "test-secret-key",
    serverURL,
    operationNamespace: "responses-fixture",
    identify: async () => ({ customerId: "customer-1" }),
    timeoutMs,
  });
}

export const { track } = client().internalApi();
/** The same action under a timeout short enough to end a stalled body read. */
export const { track: trackWithTimeout } = client(200).internalApi();

/**
 * The same client without its generated actions.
 *
 * A direct method throws the transport error itself instead of the safe error
 * data an action reports, so it is where trusted server code has to recognize an
 * ambiguous outcome.
 */
export function directClient() {
  return client();
}
