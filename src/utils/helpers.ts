import fs from "fs";

export const getOtp = (): string => {
	var digits = "0123456789";
	let OTP: string = "";
	for (let i = 0; i < 6; i++) {
		OTP += digits[Math.floor(Math.random() * 10)];
	}
	return OTP;
};

export const isImage = (filepath: string) => {
	const data = fs.readFileSync(filepath);
	const arr: Uint8Array = Uint8Array.from(data).subarray(0, 4);
	var header = "";
	for (var i = 0; i < arr.length; i++) {
		header += arr[i].toString(16).toUpperCase();
	}

	switch (header) {
		case "89504E47":
			return true;
		case "FFD8FFE1":
			return true;
		case "FFD8FFE0":
			return true;
		default:
			return false;
	}
};
