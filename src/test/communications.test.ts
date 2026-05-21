import { describe, expect, it } from "vitest";
import { buildCommunicationQueues, type CandidateInput } from "../lib/communications-queue";

describe("communications queue builder", () => {
  const today = new Date("2026-05-14T00:00:00.000Z");

  it("selects payment and preparation reminder recipients near batch start", () => {
    const queues = buildCommunicationQueues(
      [
        {
          studentId: "student_1",
          enrollmentId: "enrollment_1",
          name: "Asha",
          email: "asha@example.com",
          phone: "+6281234567",
          courseName: "200 Hour YTT",
          batchName: "June 2026",
          batchStartDate: new Date("2026-05-25T00:00:00.000Z"),
          batchEndDate: new Date("2026-06-15T00:00:00.000Z"),
          paymentStatus: "DEPOSIT_PAID",
          accessLevel: "PRE_ARRIVAL",
          certificateIssued: false,
          hasTestimonial: false,
        },
      ] satisfies CandidateInput[],
      today,
    );

    expect(queues.PAYMENT_REMINDER).toHaveLength(1);
    expect(queues.PREPARATION_REMINDER).toHaveLength(1);
    expect(queues.PREPARATION_REMINDER[0]?.channels).toEqual(["EMAIL", "WHATSAPP"]);
  });

  it("selects abandoned enrollment recipients with no access and pending payment", () => {
    const queues = buildCommunicationQueues(
      [
        {
          studentId: "student_0",
          enrollmentId: "enrollment_0",
          name: "Riya",
          email: "riya@example.com",
          phone: null,
          courseName: "100 Hour YTT",
          batchName: "July 2026",
          batchStartDate: new Date("2026-06-20T00:00:00.000Z"),
          batchEndDate: new Date("2026-07-01T00:00:00.000Z"),
          paymentStatus: "PENDING",
          accessLevel: "NONE",
          certificateIssued: false,
          hasTestimonial: false,
        },
      ] satisfies CandidateInput[],
      today,
    );

    expect(queues.ABANDONED_ENROLLMENT).toHaveLength(1);
    expect(queues.ABANDONED_ENROLLMENT[0]?.channels).toEqual(["EMAIL"]);
  });

  it("selects visa guidance recipients in pre-arrival window", () => {
    const queues = buildCommunicationQueues(
      [
        {
          studentId: "student_visa",
          enrollmentId: "enrollment_visa",
          name: "Lea",
          email: "lea@example.com",
          phone: null,
          courseName: "200 Hour YTT",
          batchName: "July 2026",
          batchStartDate: new Date("2026-06-28T00:00:00.000Z"),
          batchEndDate: new Date("2026-07-20T00:00:00.000Z"),
          paymentStatus: "DEPOSIT_PAID",
          accessLevel: "PRE_ARRIVAL",
          certificateIssued: false,
          hasTestimonial: false,
        },
      ] satisfies CandidateInput[],
      today,
    );

    expect(queues.VISA_GUIDANCE).toHaveLength(1);
    expect(queues.VISA_GUIDANCE[0]?.channels).toEqual(["EMAIL"]);
  });

  it("selects alumni review requests after batch end when no testimonial exists", () => {
    const queues = buildCommunicationQueues(
      [
        {
          studentId: "student_2",
          enrollmentId: "enrollment_2",
          name: "Maya",
          email: "maya@example.com",
          phone: null,
          courseName: "300 Hour YTT",
          batchName: "March 2026",
          batchStartDate: new Date("2026-03-01T00:00:00.000Z"),
          batchEndDate: new Date("2026-05-01T00:00:00.000Z"),
          paymentStatus: "FULL_PAID",
          accessLevel: "ALUMNI",
          certificateIssued: true,
          hasTestimonial: false,
        },
      ] satisfies CandidateInput[],
      today,
    );

    expect(queues.REVIEW_REQUEST).toHaveLength(1);
    expect(queues.REVIEW_REQUEST[0]?.email).toBe("maya@example.com");
  });
});
