import path from "path";
import os from "os";
import { ParsedUrlQuery } from "querystring";

import { spawn } from "child_process";
import { writeFileSync } from "fs";
import { createServer } from "http";
import { listen } from "async-listen";
import url from "url";
import { nanoid } from "nanoid";
import { isLoggedIn } from "./handleAuth";
export const FILENAME = ".autumn";

async function writeToConfigFile(data: ParsedUrlQuery) {
  try {
    const homeDir = os.homedir();
    const filePath = path.join(homeDir, FILENAME);
    writeFileSync(filePath, JSON.stringify(data));
  } catch (error) {
    console.error("Error writing to local config file", error);
  }
}

class UserCancellationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserCancellationError";
  }
}

export const handleLogin = async () => {
  // // 1. Check if already logged in
  if (await isLoggedIn()) {
    console.log("Already logged in!");
    return;
  }
  let authUrl = "http://localhost:3000/cli-auth";

  const oraModule = await import("ora");
  const ora = oraModule.default;

  // Create localhost server
  const server = createServer();
  const { port } = await listen(server, 0, "127.0.0.1");

  const authPromise = new Promise<ParsedUrlQuery>((resolve, reject) => {
    server.on("request", (req, res) => {
      // Set CORS headers for all responses
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
      } else if (req.method === "GET") {
        const parsedUrl = url.parse(req.url as string, true);
        const queryParams = parsedUrl.query;

        if (!queryParams.token) {
          res.writeHead(400);
          res.end();
          reject(new Error("No token provided"));
        } else {
          writeToConfigFile(queryParams);
          res.writeHead(200);
          res.end();
          resolve(queryParams);
        }
      } else {
        res.writeHead(405);
        res.end();
      }
    });
  });

  const redirect = `http://127.0.0.1:${port}`;
  const code = nanoid();

  let CLIENT_URL = "http://localhost:3000";

  const confirmationUrl = new URL(`${CLIENT_URL}/cli-auth`);
  confirmationUrl.searchParams.append("code", code);
  confirmationUrl.searchParams.append("redirect", redirect);

  spawn("open", [confirmationUrl.toString()]);
  const spinner = ora("Waiting for authentication...\n\n");

  try {
    spinner.start();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Authentication timed out after 5 seconds"));
      }, 5000);
    });
    await Promise.race([authPromise, timeoutPromise]);
    spinner.stop();

    console.log(
      `Authentication successful: wrote key to config file. To view it, type 'cat ~/${FILENAME}'.\n`
    );
    server.close();
    process.exit(0);
  } catch (error: any) {
    spinner.stop();
    if (error instanceof UserCancellationError) {
      console.log("Authentication cancelled.\n");
      server.close();
      process.exit(0);
    } else if (error.message === "Authentication timed out after 5 seconds") {
      console.log("Authentication timed out.\n");
      server.close();
      process.exit(1);
    } else {
      console.error("Authentication failed:", error);
      console.log("\n");
      server.close();
      process.exit(1);
    }
  } finally {
    server.close();
    process.exit(0);
  }
};
