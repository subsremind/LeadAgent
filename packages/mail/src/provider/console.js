import { logger } from "@repo/logs";
export const send = async ({ to, subject, text }) => {
    let formattedOutput = `Sending email to ${to} with subject ${subject}\n\n`;
    formattedOutput += `Text: ${text}\n\n`;
    logger.log(formattedOutput);
};
