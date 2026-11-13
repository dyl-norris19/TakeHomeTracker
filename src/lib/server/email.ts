import nodemailer, { type Transporter } from 'nodemailer';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

let transporter: Transporter | null = null;

/** The SMTP connection from the SMTP_* env vars, or null when it isn't set up. */
function getTransporter(): Transporter | null {
    if (!env.SMTP_HOST) {
        return null;
    }
    if (!transporter) {
        const port = Number(env.SMTP_PORT) || 587;
        transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port,
            // 465 is TLS from the first byte; other ports upgrade with STARTTLS.
            secure: port === 465,
            auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
        });
    }
    return transporter;
}

export async function sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    expiresInMinutes: number
): Promise<void> {
    const smtp = getTransporter();
    if (!smtp) {
        if (dev) {
            console.info(`[email] SMTP not configured. Password reset link for ${to}: ${resetUrl}`);
        } else {
            console.warn('[email] SMTP not configured; password reset email not sent');
        }
        return;
    }

    await smtp.sendMail({
        from: env.SMTP_FROM || env.SMTP_USER,
        to,
        subject: 'Reset your TakeHome Tracker password',
        text: [
            'Someone asked to reset the password for your TakeHome Tracker account.',
            '',
            `Open this link to choose a new password. It works once and expires in ${expiresInMinutes} minutes:`,
            '',
            resetUrl,
            '',
            "If this wasn't you, ignore this email and your password will stay the same."
        ].join('\n')
    });
}
