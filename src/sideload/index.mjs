import parse from "./parse_repo.mjs";
import download from "./download_repo.mjs";
const sideload = async (repoName) => {
  try {
    const { repo, destination } = await parse(repoName);
    await download(repo, destination);
  } catch (error) {
    throw error;
  }
};

export default sideload;
