import { Resend } from "resend";
import config from "../app/config";

export const resend = new Resend(config.mail.resend_api_key);

export interface ISendEmailPayload {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string | string[];
    text?: string;
}

/**
 * Send email via Resend API
 */
export const sendEmailWithResend = async (payload: ISendEmailPayload) => {
    const { to, subject, html, from, cc, bcc, replyTo, text } = payload;

    try {
        const data = await resend.emails.send({
            from: from || config.mail.from_email,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
            ...(cc && { cc: Array.isArray(cc) ? cc : [cc] }),
            ...(bcc && { bcc: Array.isArray(bcc) ? bcc : [bcc] }),
            ...(replyTo && { reply_to: replyTo }),
            ...(text && { text }),
        });

        return data;
    } catch (error) {
        console.error("Resend Email error:", error);
        throw error;
    }
};
