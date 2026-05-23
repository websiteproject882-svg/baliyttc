import { Resend } from "resend";
import { isGmailConfigured, sendGmailEmail } from "@/lib/gmail-smtp";

let resendClient: Resend | null = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export const isEmailConfigured = () => {
  return !!process.env.RESEND_API_KEY || isGmailConfigured();
};

function getFromEmail() {
  return process.env.EMAIL_FROM || "Bali YTTC <noreply@baliyttc.com>";
}

function getSupportEmail() {
  return process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || "info@baliyttc.com";
}

function getAdminEmail() {
  return process.env.ADMIN_EMAIL || getSupportEmail();
}

function getPublicBaseUrl() {
  return (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export async function sendEmail(options: EmailOptions) {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, error: "RESEND_API_KEY is not configured" };
    }
    console.log("[Email Dev] Would send email:", options.subject);
    console.log("[Email Dev] To:", options.to);
    return { success: true, demo: true };
  }

  const resend = getResendClient();

  if (!resend && isGmailConfigured()) {
    return sendGmailEmail(options);
  }

  if (!resend) {
    return { success: false, error: "Email provider is not configured" };
  }

  try {
    const result = await resend.emails.send({
      from: getFromEmail(),
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
    });

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}

// Enrollment confirmation email to student
export async function sendEnrollmentConfirmation(data: {
  name: string;
  email: string;
  course: string;
  batch: string;
  amount: number;
  paymentType: "deposit" | "full";
}) {
  const paymentTypeLabel = data.paymentType === "deposit" ? "Deposit" : "Full Payment";

  return sendEmail({
    to: data.email,
    subject: `Welcome to Bali YTTC - ${data.course} Enrollment Confirmed!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #F04E23, #E03E11); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Bali YTTC!</h1>
        </div>
        <div style="padding: 30px;">
          <h2>Hi ${data.name},</h2>
          <p>Your enrollment has been confirmed! We're thrilled to have you join us for your yoga teacher training journey.</p>

          <div style="background: #f8f8f8; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Enrollment Details</h3>
            <p><strong>Course:</strong> ${data.course}</p>
            <p><strong>Batch:</strong> ${data.batch}</p>
            <p><strong>Payment:</strong> ${paymentTypeLabel} - $${data.amount}</p>
          </div>

          ${data.paymentType === "deposit" ? `
            <div style="background: #fff3cd; padding: 15px; border-radius: 10px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Next Steps:</strong></p>
              <ul>
                <li>Complete the remaining balance 30 days before your start date</li>
                <li>You'll receive your pre-arrival materials soon</li>
                <li>Join our WhatsApp group for updates</li>
              </ul>
            </div>
          ` : `
            <div style="background: #d4edda; padding: 15px; border-radius: 10px; margin: 20px 0;">
              <p style="margin: 0; color: #155724;"><strong>Full payment received!</strong> You now have full access to all course materials.</p>
            </div>
          `}

          <p>If you have any questions, don't hesitate to reach out to us at <a href="mailto:${getSupportEmail()}">${getSupportEmail()}</a> or via WhatsApp.</p>

          <p>See you in Bali!</p>
          <p><strong>The Bali YTTC Team</strong></p>
        </div>
      </div>
    `,
  });
}

// Admin notification for new enrollment
export async function sendAdminEnrollmentNotification(data: {
  name: string;
  email: string;
  phone: string;
  course: string;
  batch: string;
  amount: number;
  paymentType: "deposit" | "full";
}) {
  return sendEmail({
    to: getAdminEmail(),
    subject: `New Enrollment: ${data.name} - ${data.course}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #333; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Enrollment Alert</h1>
        </div>
        <div style="padding: 30px;">
          <div style="background: #e7f3ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Student Information</h3>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
            <p><strong>Phone:</strong> ${data.phone}</p>
          </div>

          <div style="background: #f8f8f8; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Enrollment Details</h3>
            <p><strong>Course:</strong> ${data.course}</p>
            <p><strong>Batch:</strong> ${data.batch}</p>
            <p><strong>Payment:</strong> ${data.paymentType === "deposit" ? "Deposit" : "Full"} - $${data.amount}</p>
          </div>

          <p><a href="${getPublicBaseUrl()}/en/admin/enrollments" style="background: #F04E23; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View in Admin Dashboard</a></p>
        </div>
      </div>
    `,
  });
}

// Payment confirmation email
export async function sendPaymentConfirmation(data: {
  name: string;
  email: string;
  amount: number;
  course: string;
  paymentType: "deposit" | "full";
}) {
  const paymentTypeLabel = data.paymentType === "deposit" ? "Deposit" : "Full Payment";

  return sendEmail({
    to: data.email,
    subject: `Payment Received - ${data.course}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #28a745; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Payment Confirmed!</h1>
        </div>
        <div style="padding: 30px;">
          <h2>Hi ${data.name},</h2>
          <p>We've received your ${paymentTypeLabel.toLowerCase()} payment.</p>

          <div style="background: #f8f8f8; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
            <p style="font-size: 24px; margin: 0;"><strong>$${data.amount}</strong></p>
            <p style="margin: 10px 0 0;">${paymentTypeLabel} for ${data.course}</p>
          </div>

          ${data.paymentType === "full" ? `
            <p>Your payment is complete. You now have full access to all course materials.</p>
          ` : `
            <p>Your deposit has been received. The remaining balance is due 30 days before your course starts.</p>
          `}

          <p>Thank you for joining Bali YTTC!</p>
        </div>
      </div>
    `,
  });
}

// Reminder email
export async function sendReminderEmail(data: {
  name: string;
  email: string;
  course: string;
  daysUntilStart: number;
  type: "payment" | "preparation" | "general";
}) {
  const reminders = {
    payment: {
      subject: `Reminder: Complete Your Payment - ${data.course}`,
      content: `
        <p>This is a friendly reminder to complete your payment for ${data.course}. The remaining balance is due 30 days before your start date.</p>
          <p><a href="${getPublicBaseUrl()}/en/app/dashboard" style="background: #F04E23; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Payment</a></p>
      `,
    },
    preparation: {
      subject: `Pre-Training Checklist - ${data.course}`,
      content: `
        <p>Your training starts in ${data.daysUntilStart} days! Complete these tasks to prepare:</p>
        <ul>
          <li>Read the course manual introduction</li>
          <li>Watch the welcome video</li>
          <li>Review the packing list</li>
          <li>Complete your profile</li>
          <li>Join the batch WhatsApp group</li>
        </ul>
        <p><a href="${getPublicBaseUrl()}/en/app/dashboard" style="background: #F04E23; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Tasks</a></p>
      `,
    },
    general: {
      subject: `Your Journey Begins Soon - ${data.course}`,
      content: `
        <p>We're excited to see you soon in Bali for ${data.course}!</p>
        <p>Make sure you're prepared for an amazing transformation.</p>
      `,
    },
  };

  const reminder = reminders[data.type];

  return sendEmail({
    to: data.email,
    subject: reminder.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #F04E23, #E03E11); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Bali YTTC</h1>
        </div>
        <div style="padding: 30px;">
          <h2>Hi ${data.name},</h2>
          ${reminder.content}
          <p>If you have any questions, reach out at <a href="mailto:${getSupportEmail()}">${getSupportEmail()}</a>.</p>
          <p>See you in Bali!</p>
        </div>
      </div>
    `,
  });
}
