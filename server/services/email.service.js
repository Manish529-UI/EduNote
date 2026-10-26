import nodemailer from "nodemailer";

export const sendPasswordResetEmail = async (toEmail, resetUrl) => {
    const hasSmtpConfig = (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
                          (process.env.EMAIL_USER && process.env.EMAIL_PASS);

    if (!hasSmtpConfig) {
        console.warn("⚠️ SMTP environment variables not configured. Password reset email was not sent.");
        return {
            sent: false,
            reason: "SMTP_NOT_CONFIGURED"
        };
    }

    try {
        let transporter;
        if (process.env.SMTP_HOST) {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: process.env.SMTP_SECURE === "true",
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER || "EduNote <noreply@edunote.ai>",
            to: toEmail,
            subject: "Reset your EduNote password",
            text: `Hello,\n\nYou recently requested to reset your password for your EduNote account. Click the link below to reset it:\n\n${resetUrl}\n\nThis link is valid for 1 hour. If you did not request this, please ignore this email.\n\nBest regards,\nEduNote Team`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #000; text-align: center;">EduNote</h2>
                <p>Hello,</p>
                <p>You recently requested to reset your password for your EduNote account. Click the button below to proceed:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #0066cc; font-size: 13px;">${resetUrl}</p>
                <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                    This link will expire in 1 hour. If you did not make this request, you can safely ignore this email.
                </p>
            </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return { sent: true };
    } catch (error) {
        console.error("❌ Failed to send password reset email:", error.message);
        return { sent: false, error: error.message };
    }
};
