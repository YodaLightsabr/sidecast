import parse from "../sideload/parse_repo.js";
import fs from "fs/promises";
const remove = async (extension) => {
  let correctPath, extName;
  try {
    const { repo, destination } = await parse(extension);
    await fs.access(destination);
    correctPath = destination;
    extName = repo;
  } catch (err) {
    throw new Error("Invalid extension");
  }
  try {
    await fs.rm(correctPath, { recursive: true, force: true });
  } catch (err) {
    throw new Error("Could not remove extension");
  }
  return extName;
};
export default remove;
