import fs from "fs";
import fsp from "fs/promises";
import { SupportedFormats } from "../drytypes/SupportedFormats";

export interface Picture {
	path: string;
	size: number;
	type: string;
	name: string;
}

export const generateOtp = (): string => {
	const digits = "0123456789";
	let OTP = "";

	for (let i = 0; i < 6; i++) OTP += digits[Math.floor(Math.random() * 10)];

	return OTP;
};

export const createArray = (from: number, to: number) =>
	Array.from(Array(to - from + 1)).map((x) => from + x);

/**
 * @param filepath the path of the file to check the format of
 * @returns false if the file is not an image, or a string containing the image format
 */
export const isFileImage = async (
	filepath: string
): Promise<SupportedFormats | false> => {
	const header = Uint8Array.from(await fsp.readFile(filepath))
		.subarray(0, 4)
		.reduce((acc, curr) => {
			return acc + curr.toString(16).toUpperCase();
		}, "");

	const validHeaders = {
		png: "89504E47",
		jpeg: ["FFD8FFDB", "FFD8FFEE", "FFD8FFE1", "FFD8FFE0"],
	};

	for (const [k, v] of Object.entries(validHeaders)) {
		if (Array.isArray(v)) {
			if (v.find((x) => x === header) != undefined)
				return k as SupportedFormats;
		} else if (header === v) return k as SupportedFormats;
	}

	return false;
};

export const doesFileExist = async (path: string) => {
	try {
		await fsp.access(path, fs.constants.F_OK);
		return true;
	} catch {
		return false;
	}
};
