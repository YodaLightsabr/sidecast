# Sidecast
CLI tool for sideloading Raycast extensions

![image](https://user-images.githubusercontent.com/76178582/138618028-26fe5c9e-2cff-4480-95b8-cd8ae4f8412f.png)

## Installation
```
npm install -g sidecast
```

## Usage
 - `sidecast help` - Open the help menu
 - `sidecast sideload <github repo> [-v, verbose]` - Sideload an extension (GitHub Repo is user/repo#branch, defaulting to master) [install, i]
 - `sidecast remove <extension name> [-v, verbose]` - Remove the files for an extension [purge]
 - `version` - Check Sidecast version [v]

## Examples
### How to sideload an extension
Find an extension on GitHub that you'd like to sideload. You'll need the user, repository name, and branch of the extension. Next, you'll want to open up your terminal and run `sidecast sideload <github repo>`, where `<github repo>` is the repository.

Now, you'll want to make sure you have the built-in Raycast Developer extension enabled. Run the **Import Extension** command, and find your extension in the `~/_sidecast` directory.

You're done!
