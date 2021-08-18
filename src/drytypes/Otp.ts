import { makeDryType } from "drytypes";

export const Otp = makeDryType<string>((x) => {
	if (typeof x != "string") return { success: false };

	if (x.length != 6) {
		return {
			success: false,
			message: "Otp length must be 6 characters",
		};
	} else {
		return { success: true };
	}
}, "otp (string) ");
