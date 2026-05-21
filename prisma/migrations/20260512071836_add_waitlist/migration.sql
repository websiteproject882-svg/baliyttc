-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'NOTIFIED', 'CONVERTED', 'EXPIRED', 'DECLINED');

-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "courseSlug" TEXT NOT NULL,
    "batchId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "notes" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "convertedEnrollmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);
