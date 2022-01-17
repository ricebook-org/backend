import { makeDryType, String } from "drytypes";

const re = /^\d+$/;

const StrNumber = makeDryType<string>((x) => {
	if (!String.guard(x)) return { success: false };

	if (!re.test(x))
		return { success: false, message: "Value must be a number!" };
	else return { success: true };
});

export default StrNumber;
