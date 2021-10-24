# Sidecast
CLI tool for sideloading Raycast extensions

## Installation
```
npm install -g sidecast
```

## Usage
 - `sidecast help` - Open the help menu
 - `sidecast sideload <github repo> - Sideload an extension (GitHub Repo is user/repo#branch, defaulting to master)

## Examples
### How to sideload an extension
Find an extension on GitHub that you'd like to sideload. You'll need the user, repository name, and branch of the extension. Next, you'll want to open up your termianl and run `sidecast sideload <github repo>`, where `<github repo>` is the repository.

Now, you'll want to make sure you have the built-in Raycast Developer extension enabled. Run the **Import Extension** command, and find your extension in the `~/_sidecast` directory.

You're done!