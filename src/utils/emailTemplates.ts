import { sendNodemailerMail } from "./nodemailer";
import { sendEmailWithResend } from "./resend";
import config from "../app/config";

/**
 * Dispatch mail via RESEND or Nodemailer based on environment config
 */
const sendMail = (to: string | string[], subject: string, html: string, from?: string) => {
    if (config.mail.driver === "RESEND") {
        sendEmailWithResend({ to, subject, html, from }).catch((error) => {
            console.error("Resend Email error:", error);
        });
    } else {
        sendNodemailerMail(to, subject, html, from);
    }
};

/**
 * Core HTML Email Wrapper Template
 * Designed for maximum email client compatibility (Gmail, Outlook, Apple Mail, Mobile)
 * matching Bazar Hisab's signature Gold (#e8a020) & Dark Espresso (#1a0e07) design language.
 */
const renderBaseLayout = ({ preheader = "Notification from Bazar Hisab", title, bodyHtml, footerText = "This is an automated email from Bazar Hisab. Please do not reply directly." }: { preheader?: string; title: string; bodyHtml: string; footerText?: string }) => {
    const currentYear = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <!-- Hidden Preheader -->
    <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        ${preheader}
    </div>

    <!-- Outer Container -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 15px;">
        <tr>
            <td align="center">
                <!-- Email Card Container -->
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);">
                    
                    <!-- Header Bar -->
                    <tr>
                        <td style="background-color: #1a0e07; padding: 24px 32px; text-align: center; border-bottom: 3px solid #e8a020;">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                                <tr>
                                    <td style="vertical-align: middle;">
                                        <img src="${config.server_url ? `${config.server_url.replace(/\/$/, "")}/logo.png` : "https://mybazarhisab-backend.vercel.app/logo.png"}" alt="Bazar Hisab Logo" width="36" height="36" style="display: block; width: 36px; height: 36px; border-radius: 8px; border: 0; object-fit: contain; background-color: #e8a020;" />
                                    </td>
                                    <td style="padding-left: 12px; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 1px; font-family: 'Segoe UI', sans-serif; vertical-align: middle;">
                                        BAZAR <span style="color: #e8a020;">HISAB</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Main Content Body -->
                    <tr>
                        <td style="padding: 36px 32px 30px 32px; color: #334155; font-size: 15px; line-height: 1.6;">
                            ${bodyHtml}
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 32px;">
                            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 0;">
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #fafafa; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                            <p style="margin: 0 0 8px 0;">${footerText}</p>
                            <p style="margin: 0; font-weight: 600; color: #64748b;">
                                &copy; ${currentYear} Bazar Hisab Platform. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
};

/**
 * Helper to ensure links use full CLIENT_URL if a relative path is provided
 */
const formatClientUrl = (rawUrl: string): string => {
    if (!rawUrl) return config.client_url || "";
    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
        return rawUrl;
    }
    const baseUrl = config.client_url ? config.client_url.replace(/\/$/, "") : "";
    const path = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
    return `${baseUrl}${path}`;
};

/**
 * 1. Email Verification Template
 */
export const sendVerificationEmail = (email: string, name: string, verificationUrl: string, otp?: string) => {
    const title = "Verify Your Email Address";
    const fullUrl = formatClientUrl(verificationUrl);
    const bodyHtml = `
        <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 12px; font-size: 20px; font-weight: 700;">Hello ${name},</h2>
        <p style="margin-bottom: 24px; color: #475569;">Thank you for signing up for <strong>Bazar Hisab</strong>. Please verify your email address to start tracking your family and group expenses, utility bills, and daily spending with ease.</p>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
            <a href="${fullUrl}" target="_blank" style="background-color: #e8a020; color: #1a0e07; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(232, 160, 32, 0.3);">
                Verify Email Address
            </a>
        </div>

        ${
            otp
                ? `
        <!-- OTP Code Box -->
        <div style="background-color: #fffbeb; border: 1px dashed #fcd34d; border-radius: 10px; padding: 20px; text-align: center; margin: 28px 0;">
            <p style="margin: 0 0 8px 0; color: #92400e; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Or Enter 6-Digit Code In App</p>
            <div style="font-size: 32px; font-weight: 800; color: #78350f; letter-spacing: 6px;">${otp}</div>
            <p style="margin: 8px 0 0 0; color: #b45309; font-size: 12px;">This code expires in 10 minutes.</p>
        </div>
        `
                : ""
        }

        <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${fullUrl}" style="color: #d97706; word-break: break-all;">${fullUrl}</a>
        </p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">This verification link expires in 24 hours.</p>
    `;

    const html = renderBaseLayout({ preheader: "Verify your email to start using Bazar Hisab", title, bodyHtml });
    sendMail(email, title, html);
};

/**
 * 2. OTP Code Email Template
 */
export const sendOtpEmail = (email: string, otp: string, name?: string) => {
    const title = "Your One-Time Password (OTP)";
    const recipientName = name ? `Hello ${name},` : "Hello,";
    const bodyHtml = `
        <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 12px; font-size: 20px; font-weight: 700;">${recipientName}</h2>
        <p style="margin-bottom: 20px; color: #475569;">Use the 6-digit OTP code below to complete your authentication or request in <strong>Bazar Hisab</strong>:</p>
        
        <div style="background-color: #1a0e07; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;">
            <div style="font-size: 36px; font-weight: 800; color: #e8a020; letter-spacing: 8px; font-family: monospace;">${otp}</div>
            <p style="margin: 10px 0 0 0; color: #a08060; font-size: 12px;">Valid for the next 10 minutes</p>
        </div>

        <p style="font-size: 13px; color: #64748b; margin: 0;">
            If you did not request this code, please ignore this email or contact support if you suspect unauthorized activity.
        </p>
    `;

    const html = renderBaseLayout({ preheader: `Your OTP code is ${otp}`, title, bodyHtml });
    sendMail(email, title, html);
};

/**
 * 3. Welcome Email Template
 */
export const sendWelcomeEmail = (email: string, name: string) => {
    const title = "Welcome to Bazar Hisab!";
    const bodyHtml = `
        <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 12px; font-size: 20px; font-weight: 700;">Welcome, ${name}! 🎉</h2>
        <p style="margin-bottom: 16px; color: #475569;">We're thrilled to have you join <strong>Bazar Hisab</strong> — your smart assistant for managing family & mess budgets, daily bazar expenses, utility bills, and monthly spending with ease.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #e8a020; padding: 16px 20px; border-radius: 6px; margin: 24px 0;">
            <h4 style="margin: 0 0 8px 0; color: #1a0e07; font-size: 15px; font-weight: 700;">What you can do now:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.6;">
                <li>Create or join a Group with your family or flatmates</li>
                <li>Add daily bazar expenses, grocery items & utility bills</li>
                <li>Calculate total monthly spending & track individual member balances</li>
            </ul>
        </div>

        <p style="margin-top: 20px; color: #475569;">If you ever need help or have questions, reach out to our team anytime.</p>
    `;

    const html = renderBaseLayout({ preheader: `Welcome to Bazar Hisab, ${name}!`, title, bodyHtml });
    sendMail(email, title, html);
};

/**
 * 4. Email Update Verification Template
 */
export const sendEmailUpdateVerification = (email: string, name: string, verificationUrl: string) => {
    const title = "Verify Your New Email Address";
    const fullUrl = formatClientUrl(verificationUrl);
    const bodyHtml = `
        <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 12px; font-size: 20px; font-weight: 700;">Hello ${name},</h2>
        <p style="margin-bottom: 24px; color: #475569;">You recently requested to update your registered email address on <strong>Bazar Hisab</strong>. Please confirm this change by clicking below:</p>
        
        <div style="text-align: center; margin: 32px 0;">
            <a href="${fullUrl}" target="_blank" style="background-color: #e8a020; color: #1a0e07; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(232, 160, 32, 0.3);">
                Confirm New Email
            </a>
        </div>

        <p style="font-size: 13px; color: #64748b;">
            If you did not request an email update, please change your password immediately or contact our support team.
        </p>
    `;

    const html = renderBaseLayout({ preheader: "Confirm your new email address for Bazar Hisab", title, bodyHtml });
    sendMail(email, title, html);
};

/**
 * 5. Password Reset Email Template
 */
export const sendPasswordResetEmail = (email: string, name: string, otp: string) => {
    const title = "Reset Your Password";
    const bodyHtml = `
        <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 12px; font-size: 20px; font-weight: 700;">Hello ${name},</h2>
        <p style="margin-bottom: 20px; color: #475569;">We received a request to reset your password for your <strong>Bazar Hisab</strong> account. Use the 6-digit OTP code below in the app to set a new password:</p>
        
        <div style="background-color: #1a0e07; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;">
            <p style="margin: 0 0 8px 0; color: #a08060; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Password Reset OTP Code</p>
            <div style="font-size: 36px; font-weight: 800; color: #e8a020; letter-spacing: 8px; font-family: monospace;">${otp}</div>
            <p style="margin: 10px 0 0 0; color: #a08060; font-size: 12px;">Valid for the next 10 minutes</p>
        </div>

        <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">This code expires in 10 minutes. If you didn't request a password reset, please ignore this email or contact support.</p>
    `;

    const html = renderBaseLayout({ preheader: `Your password reset code is ${otp}`, title, bodyHtml });
    sendMail(email, title, html);
};

/**
 * 6. Staff / Managed Account Reset Email Template
 */
export const sendStaffPasswordResetEmail = (email: string, name: string, passwordPlain: string, restaurantName?: string) => {
    const title = "Your Account Credentials Have Been Reset";
    const context = restaurantName ? ` associated with <strong>${restaurantName}</strong>` : "";
    const bodyHtml = `
        <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 12px; font-size: 20px; font-weight: 700;">Hello ${name},</h2>
        <p style="margin-bottom: 20px; color: #475569;">Your account credentials${context} have been reset by your administrator.</p>

        <div style="background-color: #fffbeb; border-left: 4px solid #e8a020; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h4 style="margin: 0 0 12px 0; color: #78350f; font-size: 14px; font-weight: 700;">Temporary Account Details:</h4>
            <p style="margin: 6px 0; color: #475569; font-size: 14px;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 6px 0; color: #475569; font-size: 14px;"><strong>New Password:</strong> <code style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-weight: 700;">${passwordPlain}</code></p>
        </div>

        <p style="font-size: 13px; color: #64748b;">Please log in using these details and immediately update your password in Settings for security reasons.</p>
    `;

    const html = renderBaseLayout({ preheader: "Your account password has been updated", title, bodyHtml });
    sendMail(email, title, html);
};

/**
 * 7. Contact Support Response Email Template
 */
export const sendContactReplyEmail = (email: string, recipientName: string, subject: string, messageContent: string, replyMessage: string) => {
    const title = `Re: ${subject}`;
    const bodyHtml = `
        <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 12px; font-size: 20px; font-weight: 700;">Hello ${recipientName},</h2>
        <p style="margin-bottom: 16px; color: #475569;">Thank you for contacting <strong>Bazar Hisab Support</strong> regarding: <strong>"${subject}"</strong>.</p>
        
        <!-- Original Message Quote -->
        <div style="background-color: #f8fafc; border-left: 3px solid #cbd5e1; padding: 12px 16px; margin: 16px 0; color: #64748b; font-style: italic; font-size: 14px;">
            "${messageContent}"
        </div>

        <!-- Official Support Reply Box -->
        <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <h4 style="margin: 0 0 10px 0; color: #166534; font-weight: 700; font-size: 15px;">Support Team Response:</h4>
            <div style="color: #1e293b; font-size: 15px; line-height: 1.6;">
                ${replyMessage.replace(/\n/g, "<br/>")}
            </div>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 24px;">If you have further questions or need additional assistance, feel free to submit another query.</p>
    `;

    const html = renderBaseLayout({ preheader: `Support response regarding "${subject}"`, title, bodyHtml });
    sendMail(email, title, html);
};

/**
 * 8. Group Invitation Email Template
 */
export const sendGroupInvitationEmail = (email: string, name: string, groupName: string, inviteUrl: string, inviterName: string) => {
    const title = `Invitation to join "${groupName}" on Bazar Hisab`;
    const fullUrl = formatClientUrl(inviteUrl);
    const bodyHtml = `
        <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 12px; font-size: 20px; font-weight: 700;">Hello ${name},</h2>
        <p style="margin-bottom: 20px; color: #475569;"><strong>${inviterName}</strong> has invited you to join the mess/group <strong>"${groupName}"</strong> on Bazar Hisab.</p>

        <div style="text-align: center; margin: 32px 0;">
            <a href="${fullUrl}" target="_blank" style="background-color: #e8a020; color: #1a0e07; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(232, 160, 32, 0.3);">
                Accept Invitation
            </a>
        </div>

        <p style="font-size: 13px; color: #64748b;">
            By joining, you will be able to submit daily expenses, track utility bills, and view real-time monthly spending reports.
        </p>
    `;

    const html = renderBaseLayout({ preheader: `${inviterName} invited you to join ${groupName}`, title, bodyHtml });
    sendMail(email, title, html);
};
