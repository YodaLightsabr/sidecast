import downloadGitRepo from "download-git-repo";

const download = async (repo, destination) => {
  return new Promise((resolve, reject) => {
    downloadGitRepo(repo, destination, {}, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export default download;
