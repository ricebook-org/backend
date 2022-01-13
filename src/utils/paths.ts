import path from "path";

const projectRoot = path.join(__dirname, "..", "..");
const assetsRoot = path.join(projectRoot, "assets");

export default {
	// project root, two directories behind the current file
	root: projectRoot,
	assets: {
		root: assetsRoot,
		profilePictures: path.join(assetsRoot, "profile-pictures"),
		postImages: path.join(assetsRoot, "post-images"),
	},
};
