import nodemailer from "nodemailer";
import { buildPublicUrl } from "@/lib/public-url";

// Gmail SMTP Configuration
// To set up: https://myaccount.google.com/apppasswords
// 1. Enable 2-Factor Authentication
// 2. Create App Password for "Mail"
// 3. Use the 16-character app password below

interface GmailConfig {
  email: string;
  appPassword: string; // 16-char app password from Google
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export function createGmailTransporter(config: GmailConfig) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.email,
      pass: config.appPassword,
    },
  });
}

export const isGmailConfigured = () => {
  return !!(
    process.env.GMAIL_EMAIL &&
    process.env.GMAIL_APP_PASSWORD &&
    process.env.GMAIL_EMAIL !== "your-email@gmail.com"
  );
};

function getSupportEmail() {
  return process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || process.env.GMAIL_EMAIL || "info@baliyttc.com";
}

function getAdminEmail() {
  return process.env.ADMIN_EMAIL || getSupportEmail();
}

function escapeHtml(value: string | number | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendGmailEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string; demo?: boolean }> {
  if (!isGmailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, error: "Gmail SMTP is not configured" };
    }
    console.log("[Gmail Dev] Would send email:", options.subject);
    console.log("[Gmail Dev] To:", options.to);
    return { success: true, demo: true };
  }

  try {
    const transporter = createGmailTransporter({
      email: process.env.GMAIL_EMAIL!,
      appPassword: process.env.GMAIL_APP_PASSWORD!,
    });

    const mailOptions = {
      from: `"Bali YTTC" <${process.env.GMAIL_EMAIL}>`,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      cc: options.cc
        ? Array.isArray(options.cc)
          ? options.cc.join(", ")
          : options.cc
        : undefined,
      bcc: options.bcc
        ? Array.isArray(options.bcc)
          ? options.bcc.join(", ")
          : options.bcc
        : undefined,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Gmail] Email sent: ${options.subject} to ${options.to}`);
    return { success: true };
  } catch (error) {
    console.error("[Gmail] Email send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Pre-built email templates
export async function sendEnrollmentConfirmationEmail(data: {
  name: string;
  email: string;
  course: string;
  batch: string;
  amount: number;
  currency: string;
  paymentType: "deposit" | "full";
}) {
  const paymentTypeLabel = data.paymentType === "deposit" ? "Deposit" : "Full Payment";
  const remainingAmount = data.paymentType === "deposit"
    ? data.amount * 2 - data.amount
    : 0;
  const safeName = escapeHtml(data.name);
  const safeCourse = escapeHtml(data.course);
  const safeBatch = escapeHtml(data.batch);
  const safeCurrency = escapeHtml(data.currency);
  const safeAmount = escapeHtml(data.amount);
  const safeRemainingAmount = escapeHtml(remainingAmount);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafafa;">
  <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #F04E23, #E03E15); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Bali YTTC!</h1>
    </div>
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #333;">Hi ${safeName},</p>
      <p style="font-size: 16px; color: #333;">Congratulations! Your enrollment has been confirmed.</p>

      <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px; color: #F04E23;">Enrollment Details</h3>
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Course:</td>
            <td style="padding: 8px 0; font-weight: bold;">${safeCourse}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Batch:</td>
            <td style="padding: 8px 0;">${safeBatch}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Payment Type:</td>
            <td style="padding: 8px 0;">${paymentTypeLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Amount Paid:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #22c55e;">${safeCurrency} ${safeAmount}</td>
          </tr>
          ${remainingAmount > 0 ? `
          <tr>
            <td style="padding: 8px 0; color: #666;">Remaining:</td>
            <td style="padding: 8px 0; color: #f59e0b;">${safeCurrency} ${safeRemainingAmount}</td>
          </tr>
          ` : ""}
        </table>
      </div>

      <p style="font-size: 14px; color: #666;">You'll receive access to your student portal within 24 hours after payment confirmation.</p>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${buildPublicUrl("/app/dashboard")}" style="display: inline-block; background: #F04E23; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Access Student Portal</a>
      </div>

      <p style="font-size: 14px; color: #666; margin-top: 30px;">Questions? Reply to this email or contact us at ${getSupportEmail()}</p>
    </div>
    <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999;">
      <p style="margin: 0;">Bali YTTC - Yoga Teacher Training in Ubud, Bali</p>
      <p style="margin: 5px 0 0;">Copyright ${new Date().getFullYear()} All rights reserved</p>
    </div>
  </div>
</body>
</html>
`;

  return sendGmailEmail({
    to: data.email,
    subject: `Welcome to Bali YTTC - ${data.course} Enrollment Confirmed!`,
    html,
  });
}

export async function sendAdminNotificationEmail(data: {
  type: "enrollment" | "lead" | "contact";
  name: string;
  email: string;
  course?: string;
  message?: string;
  phone?: string;
}) {
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safeCourse = escapeHtml(data.course);
  const safePhone = escapeHtml(data.phone);
  const safeMessage = escapeHtml(data.message);
  let contentHtml = "";

  if (data.type === "enrollment") {
    contentHtml = `
      <tr><td style="padding: 8px; color: #666;">Course:</td><td style="padding: 8px; font-weight: bold;">${safeCourse}</td></tr>
    `;
  } else if (data.type === "contact") {
    contentHtml = `
      <tr><td style="padding: 8px; color: #666;">Phone:</td><td style="padding: 8px;">${safePhone || "N/A"}</td></tr>
      <tr><td style="padding: 8px; color: #666;">Message:</td><td style="padding: 8px;">${safeMessage}</td></tr>
    `;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background: #1f2937; padding: 20px;">
      <h2 style="color: white; margin: 0;">New ${data.type === "enrollment" ? "Enrollment" : data.type === "lead" ? "Lead" : "Contact"}</h2>
    </div>
    <div style="padding: 20px;">
      <table style="width: 100%; font-size: 14px;">
        <tr><td style="padding: 8px; color: #666;">Name:</td><td style="padding: 8px; font-weight: bold;">${safeName}</td></tr>
        <tr><td style="padding: 8px; color: #666;">Email:</td><td style="padding: 8px;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
        ${contentHtml}
        <tr><td style="padding: 8px; color: #666;">Time:</td><td style="padding: 8px;">${new Date().toLocaleString()}</td></tr>
      </table>
      <div style="margin-top: 20px;">
        <a href="${buildPublicUrl(`/admin/${data.type === "enrollment" ? "enrollments" : "leads"}`)}" style="display: inline-block; background: #F04E23; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">View in Admin</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

  return sendGmailEmail({
    to: getAdminEmail(),
    subject: `New ${data.type === "enrollment" ? "Enrollment" : data.type === "lead" ? "Lead" : "Contact"}: ${data.name}`,
    html,
  });
}
