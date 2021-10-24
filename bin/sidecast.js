#! /usr/bin/env node
const chalk = require('chalk');
const Stump = require('stump.js');
const os = require('os');
const stump = new Stump(['Debug']);
const { exec } = require('child_process');
const fetch = require('node-fetch');
const download = require('download-git-repo');
const ascii = "      _______. __   _______   _______   ______      ___           _______..___________. \r\n     \/       ||  | |       \\ |   ____| \/      |    \/   \\         \/       ||           | \r\n    |   (----`|  | |  .--.  ||  |__   |  ,----\'   \/  ^  \\       |   (----``---|  |----` \r\n     \\   \\    |  | |  |  |  ||   __|  |  |       \/  \/_\\  \\       \\   \\        |  |      \r\n .----)   |   |  | |  \'--\'  ||  |____ |  `----. \/  _____  \\  .----)   |       |  |      \r\n |_______\/    |__| |_______\/ |_______| \\______|\/__\/     \\__\\ |_______\/        |__|      \r\n                                                                                        ";
const params = process.argv; params.shift(); params.shift();

const { URL } = require('url');

const validURL = (s, protocols) => {
    try {
        url = new URL(s);
        return protocols
            ? url.protocol
                ? protocols.map(x => `${x.toLowerCase()}:`).includes(url.protocol)
                : false
            : true;
    } catch (err) {
        return false;
    }
};


let command;
if (params[0]) command = params.shift();
else command = 'help';

const commands = {
    'help': (args) => {
        console.log('\n' + chalk.bgRed.bold.white(ascii));
        console.log(chalk.bold('\nSidecast Commands:' + `
${chalk.blue('help')} - Show the help menu
${chalk.blue('sideload <github repo>')} - Sideload an extension (GitHub Repo is user/repo#branch, defaulting to master)

More commands will be added soon!`));
    },
    'sideload': async ([ghRepo, ...args]) => {
        stump.info('Validating repository...');
        if (!ghRepo) return stump.error('You must supply a URL or GitHub repository');
        let response = await fetch('https://api.github.com/repos/' + ghRepo);
        let json = await response.json();
        if (json.message == 'Not Found') {
            if (validURL(ghRepo)) {
                ghRepo = 'direct:' + ghRepo;
            } else {
                return stump.error('Must be a URL or GitHub repository (user/repo#branch)');
            }
        }
        let fragments;
        if (ghRepo.startsWith('direct:')) {
            fragments = fragments.filter(frag => frag !== '');
            fragments = [fragments[fragments.length - 2], fragments[fragments.length - 1]];
        } else {
            fragments = ghRepo.split('/');
            fragments = fragments.filter(frag => frag !== '');
            if (fragments[fragments.length - 1].includes('#')) fragments[fragments.length - 1] = fragments[fragments.length - 1].substring(0, fragments[fragments.length - 1].indexOf('#'));
        }
        let destination = os.homedir() + '/_sidecast/' + ((fragments.length >= 2 ? fragments[fragments.length - 2] + ":" : '') + fragments[fragments.length - 1]).toLowerCase();
        stump.info('Downloading ' + chalk.blue(fragments[fragments.length - 1]) + ' to ' + chalk.blue(destination) + '...');
        await new Promise((resolve, reject) => {
        download(ghRepo, destination, (err) => {
            if (err) {
                return stump.error('There was an error while trying to download this extension. Did you specify the wrong URL or branch?');
            }
            stump.info('Installing dependencies...');
            var yourscript = exec('npm install', { cwd: destination },
            (error, stdout, stderr) => {
                stump.info('Building extension...');
                exec('./node_modules/@raycast/api/bin/ray build -e dist', { cwd: destination}, (error, stdout, stderr) => {
                if (stderr) {
                    if (args.includes('-v') || args.includes('--verbose'))
                    return stump.error('There was an error while trying to build this extension. For more details, use the ' + chalk.blue('--verbose') + '(' + chalk.blue('-v') + ') flag to use verbose mode.')
                    else return stump.error('There was an error while trying to build this extension. Errors: ' + stdout);
                }
                stump.success('Extension downloaded! Here\'s what\'s next:\n' + `
    ${chalk.bold('1.')} Open Raycast and run the ${chalk.blue('Import Extension ' + chalk.dim('Developer'))} command.
    ${chalk.bold('2.')} Navigate to ${chalk.blue('~/_sidecast')} and select ${chalk.blue(((fragments.length >= 2 ? fragments[fragments.length - 2] + "/" : '') + fragments[fragments.length - 1]).toLowerCase())}
    ${chalk.bold('3.')} Start using your extension!`);
                resolve();
                });
            });
        });
    });
          
    }
};

const defaultCommand = (command) => {
    console.log((`The command ${chalk.bold.red(command)} was not found. Run ${chalk.bold.blue('sidecast help')} for help.`))
}

if (command !== 'help') console.log(chalk.bold(chalk.red('\nSideCast') + ' >\n'))
if (commands[command]) {
    (async () => {
        let output = commands[command](params);
        if (output instanceof Promise) await output;
        console.log('');
    })();
}
else defaultCommand(command);