ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "translations" JSONB;

DROP INDEX IF EXISTS "BlogPost_slug_key";

CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_locale_key" ON "BlogPost"("slug", "locale");
CREATE INDEX IF NOT EXISTS "BlogPost_locale_status_idx" ON "BlogPost"("locale", "status");
