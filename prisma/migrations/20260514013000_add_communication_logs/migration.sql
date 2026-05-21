CREATE TYPE "CommunicationCampaign" AS ENUM ('ABANDONED_ENROLLMENT', 'PAYMENT_REMINDER', 'PREPARATION_REMINDER', 'VISA_GUIDANCE', 'REVIEW_REQUEST');

CREATE TYPE "CommunicationChannel" AS ENUM ('EMAIL', 'WHATSAPP');

CREATE TYPE "CommunicationTargetType" AS ENUM ('ENROLLMENT', 'STUDENT');

CREATE TYPE "CommunicationStatus" AS ENUM ('SENT', 'FAILED', 'SKIPPED');

CREATE TABLE "CommunicationLog" (
    "id" TEXT NOT NULL,
    "campaign" "CommunicationCampaign" NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "targetType" "CommunicationTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'SENT',
    "providerMessageId" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunicationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommunicationLog_campaign_target_idx" ON "CommunicationLog"("campaign", "channel", "targetType", "targetId", "createdAt");
