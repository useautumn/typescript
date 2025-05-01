import chalk from "chalk";
import { FILENAME, handleLogin } from "./handleLogin.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

export const isLoggedIn = async () => {
  try {
    const keyPath = path.join(os.homedir(), FILENAME);
    let value = await fs.readFile(keyPath, "utf8");

    let token = JSON.parse(value).token;

    const response = await fetch(`http://localhost:8080/organization`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status !== 200) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const getToken = async () => {
  try {
    const keyPath = path.join(os.homedir(), FILENAME);
    let value = await fs.readFile(keyPath, "utf8");

    let token = JSON.parse(value).token;
    return token;
  } catch (error) {
    console.log("Failed to get token");
    process.exit(1);
  }
};

export async function checkAuth() {
  try {
    let loggedIn = await isLoggedIn();

    if (!loggedIn) {
      console.log(`${chalk.yellow("⚠")} Unauthenticated. Running login...`);
      await handleLogin();
    }
  } catch (error: any) {
    console.log(
      `${chalk.yellow("⚠")} Failed to authenticate. Running login...`
    );
    await handleLogin();
  }
}

export async function handleLogout() {
  try {
    const keyPath = path.join(os.homedir(), FILENAME);
    await fs.rm(keyPath);
  } catch (error) {
    // console.error("Error removing tokens file", error);
  }
  console.log(`${chalk.green("✓")} Logged out`);
}
