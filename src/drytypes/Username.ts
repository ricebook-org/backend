import { makeDryType } from "drytypes";

export const Username = makeDryType<string>((x) => {
	if (typeof x != "string") return { success: false };

	if (x.length < 6 || x.length > 10) {
		return {
			success: false,
			message: "Username must be 6-10 characters long",
		};
	} else {
		return { success: true };
	}
}, "username (string) ");
