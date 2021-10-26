import parse from "./parse_repo";
import download from "./download_repo";
const sideload = async (repoName) => {
  try {
    const { repo, destination } = await parse(repoName);
    await download(repo, destination);
  } catch (error) {
    throw error;
  }
};

export default sideload;
