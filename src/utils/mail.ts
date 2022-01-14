import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export interface emailData {
	to: string;
	subject: string;
	text: string;
}

const DEV_PASS = process.env.DEV_PASS;

const transporter = nodemailer.createTransport({
	host: "smtp.zoho.in",
	secure: true,
	port: 465,
	auth: {
		user: "me@uditkaro.de",
		pass: DEV_PASS,
	},
});

export const sendMail = async (data: emailData) => {
	const mailOptions = {
		from: "noreply@ricebook.xyz",
		to: data.to,
		subject: data.subject,
		text: data.text,
	};

	await transporter.sendMail(mailOptions);
};
