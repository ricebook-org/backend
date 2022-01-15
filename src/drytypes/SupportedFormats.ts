import { DryType, ExactString } from "drytypes";

const supported = ["png", "jpeg"] as const;

export type SupportedFormats = typeof supported[number];

export const SupportedFormats = supported.reduce<
	DryType<SupportedFormats> | undefined
>((acc, curr) => {
	const currDt = ExactString<SupportedFormats>(curr);

	if (!acc) return currDt;
	else return acc.union(currDt);
}, undefined)!!;
