#!/usr/bin/env node
process.removeAllListeners("warning");

import dotenv from "dotenv";
dotenv.config();

import { Command } from "commander";
import { handleDeploy } from "./cli/deploy.js";
import { handleLogin } from "./cli/login.js";
import { checkAuth, handleLogout } from "./cli/auth.js";
import { handleInit } from "./cli/init.js";

const program = new Command();

program
  .name("recase")
  .description("CLI tool for running & managingRecase workflows")
  .version("1.0.0");

program
  .command("init")
  .description("Initialise Recase")
  .action(async () => {
    await handleInit();
  });

program
  .command("login")
  .description("Login to Recase")
  .action(async () => {
    handleLogin();
  });

program
  .command("logout")
  .description("Logout from Recase")
  .action(async () => {
    handleLogout();
  });

program
  .command("deploy")
  .description("Deploy a workflow")
  .requiredOption("-f, --file <path>", "Path to the workflow file")
  .hook("preAction", async () => await checkAuth())
  .action(async (options) => {
    handleDeploy(options);
  });

program.parse();

// program
//   .command("dev")
//   .description("Run a workflow in development mode")
//   .requiredOption("-f, --file <path>", "Path to the workflow file")
//   .action(async (options) => {});
