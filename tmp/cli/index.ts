#!/usr/bin/env node

process.removeAllListeners("warning");
import { Command } from "commander";
import { handleLogin } from "./handleLogin";
import { checkAuth, getToken } from "./handleAuth";
import { Autumn } from "../sdk";

const program = new Command();

program.name("autumn").description("Autumn CLI tool").version("0.0.1");

program
  .command("login")
  .description("Login to Recase")
  .action(async () => {
    await handleLogin();
  });

program
  .command("pricecn-init")
  .description("Init pricecn")
  .action(async () => {
    const token = await getToken();

    await checkAuth();

    const autumn = new Autumn({
      secretKey: token,
      url: "http://localhost:8080/v1",
    });

    let { data, error } = await autumn.get("/products/pricecn");
    let products = data.list;

    // Search for "*/components/autumn" dir
    const fs = require("fs");
    const path = require("path");

    function findAutumnDir(startPath: string): any {
      if (!fs.existsSync(startPath)) {
        return null;
      }

      const files = fs.readdirSync(startPath);

      for (const file of files) {
        const filePath = path.join(startPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          if (
            file === "components" &&
            fs.statSync(path.join(startPath, file, "autumn")).isDirectory()
          ) {
            return path.join(startPath, "components/autumn");
          }

          const result = findAutumnDir(filePath);
          if (result) {
            return result;
          }
        }
      }

      return null;
    }

    const autumnDir = findAutumnDir(process.cwd());
    if (!autumnDir) {
      console.log("Could not find components/autumn directory");
      process.exit(1);
    }

    console.log(autumnDir);
    console.log(products);
  });

program.parse();
