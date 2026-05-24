ALTER TABLE "GalleryImage" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'Practice';

CREATE INDEX IF NOT EXISTS "GalleryImage_category_status_idx" ON "GalleryImage"("category", "status");
