import {
  CommunicationCampaign,
  CommunicationChannel,
  CommunicationStatus,
  CommunicationTargetType,
} from "@prisma/client";
import prisma from "@/lib/prisma";
import { sendReminderEmail, sendEmail } from "@/lib/resend";
import { sendBatchReminderWhatsApp } from "@/lib/whatsapp";
import { buildCommunicationQueues, type CandidateInput, type CommunicationRecipient } from "@/lib/communications-queue";

const DAY_MS = 24 * 60 * 60 * 1000;

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function batchSuffix(batchName: string | null | undefined) {
  return batchName ? ` (${escapeHtml(batchName)})` : "";
}

async function fetchCommunicationCandidates(): Promise<CandidateInput[]> {
  const students = await prisma.student.findMany({
    include: {
      user: {
        select: {
          email: true,
          displayName: true,
        },
      },
      batch: {
        select: {
          name: true,
          startDate: true,
          endDate: true,
          course: {
            select: {
              name: true,
            },
          },
        },
      },
      enrollments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          paymentStatus: true,
        },
      },
      testimonials: {
        select: {
          id: true,
        },
      },
    },
  });

  return students.map((student) => ({
    studentId: student.id,
    enrollmentId: student.enrollments[0]?.id ?? null,
    name: student.user.displayName || student.user.email,
    email: student.user.email,
    phone: student.phone ?? null,
    courseName: student.batch?.course.name || student.enrolledCourse || "Bali YTTC",
    batchName: student.batch?.name ?? null,
    batchStartDate: student.batch?.startDate ?? null,
    batchEndDate: student.batch?.endDate ?? null,
    paymentStatus: student.enrollments[0]?.paymentStatus ?? student.paymentStatus,
    accessLevel: student.accessLevel,
    certificateIssued: student.certificateIssued,
    hasTestimonial: student.testimonials.length > 0,
  }));
}

async function hasRecentSend(recipient: CommunicationRecipient, channel: CommunicationChannel) {
  const lookbackDays = {
    ABANDONED_ENROLLMENT: 3,
    PAYMENT_REMINDER: 7,
    PREPARATION_REMINDER: 5,
    VISA_GUIDANCE: 14,
    REVIEW_REQUEST: 30,
  }[recipient.campaign];

  const since = new Date(Date.now() - lookbackDays * DAY_MS);

  const existing = await prisma.communicationLog.findFirst({
    where: {
      campaign: recipient.campaign,
      channel,
      targetType: recipient.targetType,
      targetId: recipient.targetId,
      status: "SENT",
      createdAt: {
        gte: since,
      },
    },
    select: { id: true },
  });

  return Boolean(existing);
}

async function createLog(params: {
  recipient: CommunicationRecipient;
  channel: CommunicationChannel;
  status: CommunicationStatus;
  providerMessageId?: string;
  error?: string;
}) {
  return prisma.communicationLog.create({
    data: {
      campaign: params.recipient.campaign,
      channel: params.channel,
      targetType: params.recipient.targetType,
      targetId: params.recipient.targetId,
      recipientEmail: params.recipient.email,
      recipientPhone: params.recipient.phone,
      status: params.status,
      providerMessageId: params.providerMessageId,
      error: params.error,
      metadata: {
        studentId: params.recipient.studentId,
        enrollmentId: params.recipient.enrollmentId,
        courseName: params.recipient.courseName,
        batchName: params.recipient.batchName,
      },
    },
  });
}

async function sendReviewRequestEmail(recipient: CommunicationRecipient) {
  const safeName = escapeHtml(recipient.name);
  const safeCourseName = escapeHtml(recipient.courseName);

  return sendEmail({
    to: recipient.email,
    subject: `How was your Bali YTTC experience?`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #F04E23, #E03E11); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Share your Bali YTTC story</h1>
        </div>
        <div style="padding: 30px;">
          <p>Hi ${safeName},</p>
          <p>We hope your ${safeCourseName} journey was meaningful. Your review helps future students decide with confidence.</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/en/app/reviews" style="background: #F04E23; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Submit your review
            </a>
          </p>
          <p>Thank you for being part of Bali YTTC.</p>
        </div>
      </div>
    `,
  });
}

async function sendVisaGuidanceEmail(recipient: CommunicationRecipient) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const safeName = escapeHtml(recipient.name);
  const safeCourseName = escapeHtml(recipient.courseName);
  const safeDaysUntilStart = escapeHtml(recipient.daysUntilStart ?? "a few");

  return sendEmail({
    to: recipient.email,
    subject: `Visa guidance for your Bali YTTC arrival`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #F04E23, #E03E11); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Plan your Bali arrival</h1>
        </div>
        <div style="padding: 30px;">
          <p>Hi ${safeName},</p>
          <p>Your ${safeCourseName}${batchSuffix(recipient.batchName)} starts in about ${safeDaysUntilStart} days.</p>
          <p>Now is the right time to check passport validity, pick the right visa route, and review arrival requirements for Bali.</p>
          <ul>
            <li>Passport must usually be valid for at least 6 months</li>
            <li>Short stays often use Visa on Arrival</li>
            <li>Longer stays may need B211A planning in advance</li>
            <li>Travel insurance is strongly recommended</li>
          </ul>
          <p>
            <a href="${baseUrl}/en/visa" style="background: #F04E23; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review visa guidance
            </a>
          </p>
          <p>If you are unsure which visa path fits your batch length, reply and our team will help.</p>
        </div>
      </div>
    `,
  });
}

async function sendAbandonedEnrollmentEmail(recipient: CommunicationRecipient) {
  const safeName = escapeHtml(recipient.name);
  const safeCourseName = escapeHtml(recipient.courseName);
  const safeDaysUntilStart = escapeHtml(recipient.daysUntilStart ?? "coming up");

  return sendEmail({
    to: recipient.email,
    subject: `Complete your Bali YTTC enrollment`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #F04E23, #E03E11); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Your spot is still open</h1>
        </div>
        <div style="padding: 30px;">
          <p>Hi ${safeName},</p>
          <p>We noticed you started the enrollment process for ${safeCourseName}${batchSuffix(recipient.batchName)} but have not completed payment yet.</p>
          <p>Your batch is ${safeDaysUntilStart} days away. If you want us to hold your spot or help with payment options, reply to this email and our team will assist.</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/en/pricing" style="background: #F04E23; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review pricing and next steps
            </a>
          </p>
          <p>We can also help with batch timing, accommodation, and payment planning.</p>
        </div>
      </div>
    `,
  });
}

async function upsertAbandonedLead(recipient: CommunicationRecipient) {
  const existingLead = await prisma.lead.findFirst({
    where: {
      email: recipient.email,
      source: "abandoned_enrollment",
      course: recipient.courseName,
      status: {
        notIn: ["ENROLLED", "NOT_INTERESTED", "SPAM"],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const followUpAt = new Date(Date.now() + 2 * DAY_MS);
  const note = `Auto-created from abandoned enrollment campaign${recipient.batchName ? ` for ${recipient.batchName}` : ""}.`;

  if (existingLead) {
    return prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        status: "CONTACTED",
        followUpAt,
        notes: existingLead.notes ? `${existingLead.notes}\n${note}` : note,
      },
    });
  }

  return prisma.lead.create({
    data: {
      name: recipient.name,
      email: recipient.email,
      phone: recipient.phone || "",
      source: "abandoned_enrollment",
      course: recipient.courseName,
      message: recipient.batchName
        ? `Abandoned enrollment follow-up for ${recipient.batchName}.`
        : "Abandoned enrollment follow-up.",
      status: "CONTACTED",
      notes: note,
      followUpAt,
    },
  });
}

async function sendRecipientCampaign(recipient: CommunicationRecipient) {
  const results: Array<{ channel: CommunicationChannel; status: CommunicationStatus; error?: string }> = [];

  for (const channel of recipient.channels) {
    if (await hasRecentSend(recipient, channel)) {
      await createLog({ recipient, channel, status: "SKIPPED", error: "Recently sent" });
      results.push({ channel, status: "SKIPPED", error: "Recently sent" });
      continue;
    }

    try {
      if (recipient.campaign === "ABANDONED_ENROLLMENT" && channel === "EMAIL") {
        const email = await sendAbandonedEnrollmentEmail(recipient);
        const lead = email.success ? await upsertAbandonedLead(recipient) : null;
        const log = await createLog({
          recipient,
          channel,
          status: email.success ? "SENT" : "FAILED",
          providerMessageId: "id" in email ? String(email.id ?? "") : undefined,
          error: email.success ? undefined : "Failed to send abandoned enrollment reminder",
        });
        if (email.success && lead) {
          await prisma.communicationLog.update({
            where: { id: log.id },
            data: {
              metadata: {
                studentId: recipient.studentId,
                enrollmentId: recipient.enrollmentId,
                courseName: recipient.courseName,
                batchName: recipient.batchName,
                leadId: lead.id,
              },
            },
          });
        }
        results.push({ channel, status: email.success ? "SENT" : "FAILED", error: email.success ? undefined : "Failed to send abandoned enrollment reminder" });
      }

      if (recipient.campaign === "PAYMENT_REMINDER" && channel === "EMAIL") {
        const email = await sendReminderEmail({
          name: recipient.name,
          email: recipient.email,
          course: recipient.courseName,
          daysUntilStart: recipient.daysUntilStart ?? 0,
          type: "payment",
        });
        await createLog({
          recipient,
          channel,
          status: email.success ? "SENT" : "FAILED",
          providerMessageId: "id" in email ? String(email.id ?? "") : undefined,
          error: email.success ? undefined : "Failed to send payment reminder",
        });
        results.push({ channel, status: email.success ? "SENT" : "FAILED", error: email.success ? undefined : "Failed to send payment reminder" });
      }

      if (recipient.campaign === "PREPARATION_REMINDER") {
        if (channel === "EMAIL") {
          const email = await sendReminderEmail({
            name: recipient.name,
            email: recipient.email,
            course: recipient.courseName,
            daysUntilStart: recipient.daysUntilStart ?? 0,
            type: "preparation",
          });
          await createLog({
            recipient,
            channel,
            status: email.success ? "SENT" : "FAILED",
            providerMessageId: "id" in email ? String(email.id ?? "") : undefined,
            error: email.success ? undefined : "Failed to send preparation reminder",
          });
          results.push({ channel, status: email.success ? "SENT" : "FAILED", error: email.success ? undefined : "Failed to send preparation reminder" });
        } else if (channel === "WHATSAPP" && recipient.phone) {
          const whatsapp = await sendBatchReminderWhatsApp({
            name: recipient.name,
            phone: recipient.phone,
            daysUntil: String(recipient.daysUntilStart ?? 0),
            batch: recipient.batchName || recipient.courseName,
          });
          await createLog({
            recipient,
            channel,
            status: whatsapp.success ? "SENT" : "FAILED",
            providerMessageId: whatsapp.messageId,
            error: whatsapp.success ? undefined : whatsapp.error,
          });
          results.push({ channel, status: whatsapp.success ? "SENT" : "FAILED", error: whatsapp.success ? undefined : whatsapp.error });
        }
      }

      if (recipient.campaign === "VISA_GUIDANCE" && channel === "EMAIL") {
        const email = await sendVisaGuidanceEmail(recipient);
        await createLog({
          recipient,
          channel,
          status: email.success ? "SENT" : "FAILED",
          providerMessageId: "id" in email ? String(email.id ?? "") : undefined,
          error: email.success ? undefined : "Failed to send visa guidance",
        });
        results.push({ channel, status: email.success ? "SENT" : "FAILED", error: email.success ? undefined : "Failed to send visa guidance" });
      }

      if (recipient.campaign === "REVIEW_REQUEST" && channel === "EMAIL") {
        const email = await sendReviewRequestEmail(recipient);
        await createLog({
          recipient,
          channel,
          status: email.success ? "SENT" : "FAILED",
          providerMessageId: "id" in email ? String(email.id ?? "") : undefined,
          error: email.success ? undefined : "Failed to send review request",
        });
        results.push({ channel, status: email.success ? "SENT" : "FAILED", error: email.success ? undefined : "Failed to send review request" });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown communication error";
      await createLog({ recipient, channel, status: "FAILED", error: message });
      results.push({ channel, status: "FAILED", error: message });
    }
  }

  return results;
}

export async function getCommunicationDashboardData() {
  const queues = buildCommunicationQueues(await fetchCommunicationCandidates());
  const recentLogs = await prisma.communicationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return {
    queues,
    recentLogs,
  };
}

export async function runCommunicationCampaign(params: {
  campaign: CommunicationCampaign;
  recipientKeys?: string[];
  limit?: number;
}) {
  const queues = buildCommunicationQueues(await fetchCommunicationCandidates());
  let recipients = queues[params.campaign];

  if (params.recipientKeys?.length) {
    const allowed = new Set(params.recipientKeys);
    recipients = recipients.filter((item) => allowed.has(item.key));
  }

  if (params.limit && params.limit > 0) {
    recipients = recipients.slice(0, params.limit);
  }

  const sent: Array<{ key: string; channels: Array<{ channel: CommunicationChannel; status: CommunicationStatus; error?: string }> }> = [];

  for (const recipient of recipients) {
    const channels = await sendRecipientCampaign(recipient);
    sent.push({ key: recipient.key, channels });
  }

  return {
    campaign: params.campaign,
    totalRecipients: recipients.length,
    results: sent,
  };
}
