import { config } from "@repo/config";
import nodemailer from "nodemailer";
const { from } = config.mails;
export const send = async ({ to, subject, text, html }) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number.parseInt(process.env.MAIL_PORT, 10),
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });
    await transporter.sendMail({
        to,
        from,
        subject,
        text,
        html,
    });
};
