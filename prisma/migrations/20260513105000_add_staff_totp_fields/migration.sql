-- Add TOTP fields to staff accounts for admin 2FA.
ALTER TABLE "Staff"
ADD COLUMN "totpSecret" TEXT,
ADD COLUMN "totpEnabled" BOOLEAN NOT NULL DEFAULT false;
