-- Student PWA interaction and preference fields
ALTER TABLE "Student"
ADD COLUMN IF NOT EXISTS "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "browserPushEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Coupon"
ADD COLUMN IF NOT EXISTS "appliesToAlumni" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "AnnouncementReaction" (
  "id" TEXT NOT NULL,
  "announcementId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnnouncementReaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AnnouncementReply" (
  "id" TEXT NOT NULL,
  "announcementId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnnouncementReply_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AnnouncementReaction_announcementId_studentId_key"
ON "AnnouncementReaction"("announcementId", "studentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AnnouncementReaction_announcementId_fkey'
  ) THEN
    ALTER TABLE "AnnouncementReaction"
    ADD CONSTRAINT "AnnouncementReaction_announcementId_fkey"
    FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AnnouncementReaction_studentId_fkey'
  ) THEN
    ALTER TABLE "AnnouncementReaction"
    ADD CONSTRAINT "AnnouncementReaction_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AnnouncementReply_announcementId_fkey'
  ) THEN
    ALTER TABLE "AnnouncementReply"
    ADD CONSTRAINT "AnnouncementReply_announcementId_fkey"
    FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AnnouncementReply_studentId_fkey'
  ) THEN
    ALTER TABLE "AnnouncementReply"
    ADD CONSTRAINT "AnnouncementReply_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
