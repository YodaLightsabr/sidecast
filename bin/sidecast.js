#! /usr/bin/env node
import chalk from "chalk";
import Stump from "stump.js";
const stump = new Stump(["Debug"]);
import { createInterface } from "readline";
const readline = createInterface({
  input: process.stdin,
  output: process.stdout,
});

import { exec } from "child_process";
import parse from "../src/sideload/parse_repo.js";
import download from "../src/sideload/download_repo.js";
import removeExtension from "../src/remove/index.js";

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
${chalk.blue("version")} - Check Sidecast version ${chalk.blueBright("[v]")}

More commands will be added soon!`
      )
    );
  },
  sideload: async ([ghRepo, ...args]) => {
    stump.info("Validating repository...");
    if (!ghRepo)
      return stump.error("You must supply a URL or GitHub repository");
    let repo, destination;
    try {
      const parsed = await parse(ghRepo);
      repo = parsed.repo;
      destination = parsed.destination;
      stump.info(
        "Downloading " +
          chalk.blue(repo) +
          " to " +
          chalk.blue(destination) +
          "..."
      );
    } catch (error) {
      if (error.message === "Invalid repo") {
        return stump.error(
          "Must be a URL or GitHub repository (user/repo#branch)"
        );
      } else {
        return stump.error(error.message);
      }
    }
    try {
      await download(repo, destination);
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
              )} and select ${chalk.blue(repo)}`
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
    } catch (error) {
      return stump.error(
        "There was an error while trying to download this extension. Did you specify the wrong URL or branch?"
      );
    }
  },
  remove: async ([extension, ...args]) => {
    let extName;
    try {
      extName = await removeExtension(extension);
    } catch (error) {
      if (error.message === "Invalid extension") {
        return stump.error(
          "The extension folder cannot be located. Please try manually deleting it instead."
        );
      } else if (error.message === "Could not remove extension") {
        if (args.includes("-v") || args.includes("--verbose")) {
          return stump.error(
            "There was an error while trying to remove this extension. For more details, use the " +
              chalk.blue("--verbose") +
              "(" +
              chalk.blue("-v") +
              ") flag to use verbose mode."
          );
        } else {
          return stump.error(
            "There was an error while trying to remove this extension. Errors: " +
              error
          );
        }
      } else {
        return stump.error(error.message);
      }
    }
    stump.success(
      "The extension " +
        chalk.blue(extName) +
        " was removed. You will also have to uninstall it from within Raycast by finding the extension, clicking more actions, and selecting uninstall."
    );
  },
  version: () => {
    console.log("\n" + chalk.bgRed.bold.white(ascii));
    console.log("Version 1.1.2");
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
