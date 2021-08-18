import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export interface emailData {
	to_user: string;
	subject: string;
	text: string;
}

const DEV_EMAIL = process.env.DEV_EMAIL;
const DEV_PASS = process.env.DEV_PASS;

const transporter = nodemailer.createTransport({
	service: "Yandex",
	auth: {
		user: DEV_EMAIL,
		pass: DEV_PASS,
	},
});

export const sendMail = async (data: emailData) => {
	const mailOptions = {
		from: DEV_EMAIL,
		to: data.to_user,
		subject: data.subject,
		text: data.text,
	};

	try {
		await transporter.sendMail(mailOptions);
	} catch (e) {
		throw e;
	}
};
