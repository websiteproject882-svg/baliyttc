CREATE TYPE "ResourceType" AS ENUM ('LINK', 'DOCUMENT', 'VIDEO', 'COMMUNITY');
CREATE TYPE "ResourceAudience" AS ENUM ('PRE_ARRIVAL', 'FULL', 'ALUMNI', 'ALL_ACTIVE');

CREATE TABLE "PreArrivalResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL DEFAULT 'LINK',
    "audience" "ResourceAudience" NOT NULL DEFAULT 'PRE_ARRIVAL',
    "taskKey" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreArrivalResource_pkey" PRIMARY KEY ("id")
);
