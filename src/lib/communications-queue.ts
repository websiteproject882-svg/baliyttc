import { CommunicationCampaign, CommunicationChannel, CommunicationTargetType, PaymentStatus } from "@prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;

export type CandidateInput = {
  studentId: string;
  enrollmentId: string | null;
  name: string;
  email: string;
  phone: string | null;
  courseName: string;
  batchName: string | null;
  batchStartDate: Date | null;
  batchEndDate: Date | null;
  paymentStatus: PaymentStatus;
  accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI";
  certificateIssued: boolean;
  hasTestimonial: boolean;
};

export type CommunicationRecipient = {
  key: string;
  campaign: CommunicationCampaign;
  targetType: CommunicationTargetType;
  targetId: string;
  studentId: string;
  enrollmentId: string | null;
  name: string;
  email: string;
  phone: string | null;
  courseName: string;
  batchName: string | null;
  batchStartDate: string | null;
  daysUntilStart: number | null;
  daysSinceEnd: number | null;
  accessLevel: CandidateInput["accessLevel"];
  paymentStatus: PaymentStatus;
  channels: CommunicationChannel[];
};

export function buildCommunicationQueues(candidates: CandidateInput[], today = new Date()): Record<CommunicationCampaign, CommunicationRecipient[]> {
  const normalizedToday = new Date(today);
  normalizedToday.setHours(0, 0, 0, 0);

  const queues: Record<CommunicationCampaign, CommunicationRecipient[]> = {
    ABANDONED_ENROLLMENT: [],
    PAYMENT_REMINDER: [],
    PREPARATION_REMINDER: [],
    VISA_GUIDANCE: [],
    REVIEW_REQUEST: [],
  };

  for (const candidate of candidates) {
    const daysUntilStart =
      candidate.batchStartDate
        ? Math.ceil((new Date(candidate.batchStartDate).setHours(0, 0, 0, 0) - normalizedToday.getTime()) / DAY_MS)
        : null;
    const daysSinceEnd =
      candidate.batchEndDate
        ? Math.floor((normalizedToday.getTime() - new Date(candidate.batchEndDate).setHours(0, 0, 0, 0)) / DAY_MS)
        : null;

    if (
      candidate.enrollmentId &&
      candidate.accessLevel === "NONE" &&
      candidate.paymentStatus === "PENDING" &&
      daysUntilStart !== null &&
      daysUntilStart >= 7
    ) {
      queues.ABANDONED_ENROLLMENT.push({
        key: `ABANDONED_ENROLLMENT:${candidate.enrollmentId}`,
        campaign: "ABANDONED_ENROLLMENT",
        targetType: "ENROLLMENT",
        targetId: candidate.enrollmentId,
        studentId: candidate.studentId,
        enrollmentId: candidate.enrollmentId,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        courseName: candidate.courseName,
        batchName: candidate.batchName,
        batchStartDate: candidate.batchStartDate?.toISOString() ?? null,
        daysUntilStart,
        daysSinceEnd,
        accessLevel: candidate.accessLevel,
        paymentStatus: candidate.paymentStatus,
        channels: ["EMAIL"],
      });
    }

    if (
      candidate.enrollmentId &&
      (candidate.paymentStatus === "PENDING" || candidate.paymentStatus === "DEPOSIT_PAID") &&
      daysUntilStart !== null &&
      daysUntilStart >= 0 &&
      daysUntilStart <= 45
    ) {
      queues.PAYMENT_REMINDER.push({
        key: `PAYMENT_REMINDER:${candidate.enrollmentId}`,
        campaign: "PAYMENT_REMINDER",
        targetType: "ENROLLMENT",
        targetId: candidate.enrollmentId,
        studentId: candidate.studentId,
        enrollmentId: candidate.enrollmentId,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        courseName: candidate.courseName,
        batchName: candidate.batchName,
        batchStartDate: candidate.batchStartDate?.toISOString() ?? null,
        daysUntilStart,
        daysSinceEnd,
        accessLevel: candidate.accessLevel,
        paymentStatus: candidate.paymentStatus,
        channels: ["EMAIL"],
      });
    }

    if (
      candidate.accessLevel !== "NONE" &&
      daysUntilStart !== null &&
      daysUntilStart >= 0 &&
      daysUntilStart <= 21
    ) {
      queues.PREPARATION_REMINDER.push({
        key: `PREPARATION_REMINDER:${candidate.studentId}`,
        campaign: "PREPARATION_REMINDER",
        targetType: "STUDENT",
        targetId: candidate.studentId,
        studentId: candidate.studentId,
        enrollmentId: candidate.enrollmentId,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        courseName: candidate.courseName,
        batchName: candidate.batchName,
        batchStartDate: candidate.batchStartDate?.toISOString() ?? null,
        daysUntilStart,
        daysSinceEnd,
        accessLevel: candidate.accessLevel,
        paymentStatus: candidate.paymentStatus,
        channels: candidate.phone ? ["EMAIL", "WHATSAPP"] : ["EMAIL"],
      });
    }

    if (
      candidate.accessLevel !== "NONE" &&
      daysUntilStart !== null &&
      daysUntilStart >= 14 &&
      daysUntilStart <= 60
    ) {
      queues.VISA_GUIDANCE.push({
        key: `VISA_GUIDANCE:${candidate.studentId}`,
        campaign: "VISA_GUIDANCE",
        targetType: "STUDENT",
        targetId: candidate.studentId,
        studentId: candidate.studentId,
        enrollmentId: candidate.enrollmentId,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        courseName: candidate.courseName,
        batchName: candidate.batchName,
        batchStartDate: candidate.batchStartDate?.toISOString() ?? null,
        daysUntilStart,
        daysSinceEnd,
        accessLevel: candidate.accessLevel,
        paymentStatus: candidate.paymentStatus,
        channels: ["EMAIL"],
      });
    }

    if (
      !candidate.hasTestimonial &&
      (candidate.accessLevel === "ALUMNI" || candidate.certificateIssued) &&
      daysSinceEnd !== null &&
      daysSinceEnd >= 0 &&
      daysSinceEnd <= 120
    ) {
      queues.REVIEW_REQUEST.push({
        key: `REVIEW_REQUEST:${candidate.studentId}`,
        campaign: "REVIEW_REQUEST",
        targetType: "STUDENT",
        targetId: candidate.studentId,
        studentId: candidate.studentId,
        enrollmentId: candidate.enrollmentId,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        courseName: candidate.courseName,
        batchName: candidate.batchName,
        batchStartDate: candidate.batchStartDate?.toISOString() ?? null,
        daysUntilStart,
        daysSinceEnd,
        accessLevel: candidate.accessLevel,
        paymentStatus: candidate.paymentStatus,
        channels: ["EMAIL"],
      });
    }
  }

  return queues;
}
