#! /usr/bin/env node
import chalk from "chalk";
import Stump from "stump.js";
import os from "os";
const stump = new Stump(["Debug"]);
import { createInterface } from "readline";
const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

import fs from "fs/promises";
import { exec } from "child_process";
import fetch from "node-fetch";
import download from "download-git-repo";
const ascii =
  "      _______. __   _______   _______   ______      ___           _______..___________. \r\n     /       ||  | |       \\ |   ____| /      |    /   \\         /       ||           | \r\n    |   (----`|  | |  .--.  ||  |__   |  ,----'   /  ^  \\       |   (----``---|  |----` \r\n     \\   \\    |  | |  |  |  ||   __|  |  |       /  /_\\  \\       \\   \\        |  |      \r\n .----)   |   |  | |  '--'  ||  |____ |  `----. /  _____  \\  .----)   |       |  |      \r\n |_______/    |__| |_______/ |_______| \\______|/__/     \\__\\ |_______/        |__|      \r\n                                                                                        ";
const params = process.argv;
params.shift();
params.shift();

import { URL } from "url";

const validURL = (s, protocols) => {
  try {
    url = new URL(s);
    return protocols
      ? url.protocol
        ? protocols.map((x) => `${x.toLowerCase()}:`).includes(url.protocol)
        : false
      : true;
  } catch (err) {
    return false;
  }
};

let command;
if (params[0]) command = params.shift();
else command = "help";

const commands = {
  help: (args) => {
    console.log("\n" + chalk.bgRed.bold.white(ascii));
    console.log(
      chalk.bold(
        "\nSidecast Commands:" +
          `
${chalk.blue("help")} - Show the help menu
${chalk.blue(
  "sideload <github repo> [-v, --verbose]"
)} - Sideload an extension (GitHub Repo is user/repo#branch) ${chalk.blueBright(
            "[install, i]"
          )}
${chalk.blue(
  "remove <extension name> [-v, --verbose]"
)} - Remove the files for an extension ${chalk.blueBright("[purge]")}
${chalk.blue(
  "version"
)} - Check Sidecast version ${chalk.blueBright("[v]")}

More commands will be added soon!`
      )
    );
  },
  sideload: async ([ghRepo, ...args]) => {
    stump.info("Validating repository...");
    if (!ghRepo)
      return stump.error("You must supply a URL or GitHub repository");
    let response = await fetch("https://api.github.com/repos/" + ghRepo);
    let json = await response.json();
    if (json.message == "Not Found") {
      if (validURL(ghRepo)) {
        ghRepo = "direct:" + ghRepo;
      } else {
        return stump.error(
          "Must be a URL or GitHub repository (user/repo#branch)"
        );
      }
    }
    if (!ghRepo.startsWith("direct:") && !ghRepo.includes("#"))
      ghRepo += "#" + json.default_branch;
    let fragments;
    if (ghRepo.startsWith("direct:")) {
      fragments = fragments.filter((frag) => frag !== "");
      fragments = [
        fragments[fragments.length - 2],
        fragments[fragments.length - 1],
      ];
    } else {
      fragments = ghRepo.split("/");
      fragments = fragments.filter((frag) => frag !== "");
      if (fragments[fragments.length - 1].includes("#"))
        fragments[fragments.length - 1] = fragments[
          fragments.length - 1
        ].substring(0, fragments[fragments.length - 1].indexOf("#"));
    }
    let destination =
      os.homedir() +
      "/_sidecast/" +
      (
        (fragments.length >= 2 ? fragments[fragments.length - 2] + ":" : "") +
        fragments[fragments.length - 1]
      ).toLowerCase();
    stump.info(
      "Downloading " +
        chalk.blue(fragments[fragments.length - 1]) +
        " to " +
        chalk.blue(destination) +
        "..."
    );
    await new Promise((resolve, reject) => {
      download(ghRepo, destination, (err) => {
        if (err) {
          return stump.error(
            "There was an error while trying to download this extension. Did you specify the wrong URL or branch?"
          );
        }
        stump.info("Installing dependencies...");
        var yourscript = exec(
          "npm install",
          { cwd: destination },
          (error, stdout, stderr) => {
            stump.success(
              "Extension downloaded! Before the extension can be built, you have to load it first.\n" +
                `
${chalk.bold("1.")} Open Raycast and run the ${chalk.blue(
                  "Import Extension " + chalk.dim("Developer")
                )} command.
${chalk.bold("2.")} Navigate to ${chalk.blue(
                  "~/_sidecast"
                )} and select ${chalk.blue(
                  (
                    (fragments.length >= 2
                      ? fragments[fragments.length - 2] + "/"
                      : "") + fragments[fragments.length - 1]
                  ).toLowerCase()
                )}`
            );
            readline.question(
              `${chalk.bold("3.")} Press enter to continue`,
              () => {
                console.log("");
                stump.info("Building extension...");
                exec(
                  "./node_modules/@raycast/api/bin/ray build -e dist",
                  { cwd: destination },
                  (error, stdout, stderr) => {
                    console.log(stdout, stderr);
                    if (stderr) {
                      if (args.includes("-v") || args.includes("--verbose"))
                        return stump.error(
                          "There was an error while trying to build this extension. For more details, use the " +
                            chalk.blue("--verbose") +
                            "(" +
                            chalk.blue("-v") +
                            ") flag to use verbose mode."
                        );
                      else
                        return stump.error(
                          "There was an error while trying to build this extension. Errors: " +
                            stdout
                        );
                    }
                    stump.success("Extension built! You can start using it.");
                    resolve();
                  }
                );
              }
            );
          }
        );
      });
    });
  },
  remove: async ([extension, ...args]) => {
    let correctPath;
    try {
      let path = os.homedir() + "/_sidecast/" + extension.toLowerCase();
      await fs.access(path);
      correctPath = path;
    } catch (err) {
      try {
        let path =
          os.homedir() +
          "/_sidecast/" +
          extension.toLowerCase().split("/").join(":");
        await fs.access(path);
        correctPath = path;
      } catch (err) {
        return stump.error(
          "The extension folder cannot be located. Please try manually deleting it instead."
        );
      }
    }
    try {
      fs.rm(correctPath, { recursive: true, force: true });
      stump.success(
        "The extension " +
          chalk.blue(extension) +
          " was removed. You will also have to uninstall it from within Raycast by finding the extension, clicking more actions, and selecting uninstall."
      );
    } catch (err) {
      if (args.includes("-v") || args.includes("--verbose"))
        return stump.error(
          "There was an error while trying to remove this extension. For more details, use the " +
            chalk.blue("--verbose") +
            "(" +
            chalk.blue("-v") +
            ") flag to use verbose mode."
        );
      else
        return stump.error(
          "There was an error while trying to remove this extension. Errors: " +
            err
        );
    }
  },
  version: () => {
    console.log("\n" + chalk.bgRed.bold.white(ascii));
    console.log('Version 1.1.2');
  },
  install: (...args) => commands.sideload(...args),
  purge: (...args) => commands.remove(...args),
  i: (...args) => commands.sideload(...args),
  v: (...args) => commands.version(...args),
};

const defaultCommand = (command) => {
  console.log(
    `The command ${chalk.bold.red(
      command
    )} was not found. Run ${chalk.bold.blue("sidecast help")} for help.`
  );
};

if (command !== "help")
  console.log(chalk.bold(chalk.red("\nSideCast") + " >\n"));
if (commands[command]) {
  (async () => {
    let output = commands[command](params);
    if (output instanceof Promise) await output;
    console.log("");
    process.exit();
  })();
} else defaultCommand(command);
