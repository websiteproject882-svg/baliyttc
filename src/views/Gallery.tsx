"use client";

import { GALLERY } from "@/data/site";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";

type PublicGalleryImage = {
  id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
};

const Gallery = () => {
  const fallbackImages = useMemo<PublicGalleryImage[]>(
    () =>
      GALLERY.map((url, index) => ({
        id: `static-gallery-${index}`,
        url,
        alt: `Bali YTTC gallery image ${index + 1}`,
      })),
    [],
  );
  const [active, setActive] = useState<PublicGalleryImage | null>(null);
  const [images, setImages] = useState<PublicGalleryImage[]>(fallbackImages);

  useEffect(() => {
    let cancelled = false;

    async function loadGallery() {
      try {
        const response = await fetch("/api/gallery?limit=60");
        if (!response.ok) return;
        const data = (await response.json()) as { images?: PublicGalleryImage[] };
        if (!cancelled && data.images?.length) {
          setImages(data.images);
        }
      } catch {
        // Static gallery remains available if the admin-backed gallery is unavailable.
      }
    }

    loadGallery();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="pt-40 pb-12 bg-cream">
        <div className="container-edit">
          <SectionHeading
            eyebrow="Inside the ashram"
            title={<>Moments from <em className="text-terra">Ubud</em></>}
            sub="Glimpses of practice, ceremony, nature and community - captured during our trainings."
          />
        </div>
      </section>

      <section className="pb-28 bg-cream">
        <div className="container-wide">
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4 [&>*]:mb-3 md:[&>*]:mb-4">
            {images.map((image, i) => (
              <Reveal key={image.id} delay={(i % 8) * 0.04}>
                <button
                  onClick={() => setActive(image)}
                  className="block w-full break-inside-avoid rounded-md overflow-hidden group bg-sand/20 min-h-[100px]"
                >
                  <img
                    src={image.url}
                    alt={image.alt || image.caption || ""}
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-5xl bg-warm-dark border-warm-dark p-2">
          {active && <img src={active.url} alt={active.alt || active.caption || ""} className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Gallery;
