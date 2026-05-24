import Gallery from "@/views/Gallery";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getInitialGalleryImages() {
  try {
    return await prisma.galleryImage.findMany({
      where: {
        OR: [{ status: "ACTIVE" }, { status: "APPROVED" }],
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 60,
      select: {
        id: true,
        url: true,
        alt: true,
        caption: true,
        type: true,
      },
    });
  } catch {
    return [];
  }
}

export default async function GalleryPage() {
  const images = await getInitialGalleryImages();

  return (
    <NextLayoutWrapper>
      <Gallery initialImages={images} />
    </NextLayoutWrapper>
  );
}
