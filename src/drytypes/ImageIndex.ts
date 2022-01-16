import { DryType, makeDryType, String } from "drytypes";

const numberRe = /^[1234]$/;

export const ImageIndex = makeDryType<string>((x) => {
	if (!String.guard(x)) return { success: false };
	else {
		if (!numberRe.test(x))
			return {
				success: false,
				message: "A post can have at most 4 images!",
			};
		else return { success: true };
	}
});
