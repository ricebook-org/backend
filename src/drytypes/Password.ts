import { makeDryType } from "drytypes";

export const Password = makeDryType<string>((x) => {
	if (typeof x != "string") return { success: false };

	if (x.length < 6 || x.length > 30) {
		return {
			success: false,
			message: "Password must be 6-30 characters long",
		};
	} else {
		return { success: true };
	}
}, "password (string) ");
