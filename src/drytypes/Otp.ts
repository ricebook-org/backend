import { makeDryType, String } from "drytypes";

export const Otp = makeDryType<string>((x) => {
	if (!String.guard(x)) return { success: false };

	if (x.length != 6)
		return {
			success: false,
			message: "Otp length must be 6 characters",
		};
	else return { success: true };
}, "otp (string) ");
