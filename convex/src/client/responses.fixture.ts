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
let receivedBody = "";
let receivedHeaders = new Headers();

/** Set what the server answers next and forget earlier requests. */
export function planResponse(next: ResponsePlan): void {
  plan.status = next.status;
  plan.body = next.body;
  received = 0;
  receivedBody = "";
  receivedHeaders = new Headers();
}

export function requestCount(): number {
  return received;
}

export function requestBody(): string {
  return receivedBody;
}

export function requestHeaders(): Headers {
  return new Headers(receivedHeaders);
}

async function handle(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const { status, body: behavior } = plan;
  received += 1;
  const headerEntries: [string, string][] = [];
  for (const [name, value] of Object.entries(request.headers)) {
    if (value !== undefined) {
      headerEntries.push([
        name,
        Array.isArray(value) ? value.join(", ") : value,
      ]);
    }
  }
  receivedHeaders = new Headers(headerEntries);
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  receivedBody = Buffer.concat(chunks).toString("utf8");
  const body = JSON.stringify(
    status >= 200 && status < 300
      ? { customer_id: "customer-1", value: 1, balance: null }
      : { message: "provider failure" }
  );
  response.writeHead(status, {
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
