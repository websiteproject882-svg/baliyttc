CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ACTION');

CREATE TYPE "NotificationAudience" AS ENUM ('PRE_ARRIVAL', 'FULL', 'ALUMNI', 'ALL_ACTIVE', 'INDIVIDUAL');

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "audience" "NotificationAudience" NOT NULL DEFAULT 'ALL_ACTIVE',
    "batchId" TEXT,
    "studentId" TEXT,
    "actionUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationReceipt" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationReceipt_notificationId_studentId_key" ON "NotificationReceipt"("notificationId", "studentId");
CREATE INDEX "Notification_publishedAt_audience_idx" ON "Notification"("publishedAt", "audience");

ALTER TABLE "NotificationReceipt" ADD CONSTRAINT "NotificationReceipt_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationReceipt" ADD CONSTRAINT "NotificationReceipt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
