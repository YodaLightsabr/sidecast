import fetch from "node-fetch";
import os from "os";

const parse = async (repo) => {
  let [user, repoName] = repo.split("/");
  if (!repoName) {
    throw new Error(`Invalid repo`);
  }
  let branch;
  [repoName, branch] = repoName.split("#");
  const repoURL = `https://api.github.com/repos/${user}/${repoName}`;
  const res = await fetch(repoURL, {
    headers: {
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) {
    throw new Error("Invalid repo");
  }
  const repoData = await res.json();
  if (!branch) {
    branch = repoData.default_branch;
  }
  const destination = `${os.homedir()}/_sidecast/${user}:${repoName}#${branch}`;
  return {
    repo: `${user}/${repoName}#${branch}`,
    destination,
  };
};

export default parse;
