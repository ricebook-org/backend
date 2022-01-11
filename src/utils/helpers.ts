import fs from "fs";

export interface Picture {
	path: string;
	size: number;
	type: string;
	name: string;
}

export const getOtp = (): string => {
	const digits = "0123456789";
	let OTP = "";

	for (let i = 0; i < 6; i++) OTP += digits[Math.floor(Math.random() * 10)];

	return OTP;
};

export const isFileImage = (filepath: string) => {
	const fileHeader = Uint8Array.from(fs.readFileSync(filepath))
		.subarray(0, 4)
		.reduce((acc, curr) => {
			return acc + curr.toString(16).toUpperCase();
		}, "");

	const validHeaders = ["89504E47", "FFD8FFE1", "FFD8FFE0"];

	return validHeaders.find((x) => x === fileHeader) !== undefined;
};
