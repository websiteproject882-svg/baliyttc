"use client";

import { GALLERY } from "@/data/site";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";

const galleryFilters = ["All", "Practice", "Ceremony", "Campus", "Nature", "Teachers", "Courses"] as const;
type GalleryFilter = (typeof galleryFilters)[number];

type PublicGalleryImage = {
  id: string;
  url: string;
  alt?: string | null;
  caption?: string | null;
  category?: GalleryFilter;
};

const staticGalleryCategories: GalleryFilter[] = [
  "Campus",
  "Campus",
  "Campus",
  "Campus",
  "Campus",
  "Campus",
  "Campus",
  "Campus",
  "Campus",
  "Campus",
  "Campus",
  "Ceremony",
  "Practice",
  "Ceremony",
  "Practice",
  "Practice",
  "Practice",
  "Nature",
  "Practice",
  "Teachers",
  "Teachers",
  "Courses",
  "Courses",
  "Ceremony",
  "Practice",
  "Ceremony",
  "Courses",
  "Courses",
  "Courses",
  "Courses",
];

const staticGalleryLabels = [
  "Aerial view of Bali YTTC campus",
  "Open-air yoga shala in Ubud",
  "Yoga studio and pool sanctuary",
  "Private villa pool",
  "Swimming pool and garden",
  "Second pool view",
  "Private villa exterior",
  "Campus reception area",
  "Shared villa room",
  "Private villa room",
  "Shared room with natural light",
  "Villa room garden view",
  "Clean en-suite bathroom",
  "Opening ceremony for 200-hour YTT",
  "Yoga teacher training class",
  "Temple purification ceremony",
  "Arm balancing workshop",
  "Sound healing session",
  "Acro yoga practice",
  "Beach yoga at sunrise",
  "Mandala meditation art",
  "Vivek Kalura teaching portrait",
  "Sachin Rautela teaching portrait",
  "100-hour YTT schedule moment",
  "Student review moment",
  "Balinese ceremony practice",
  "Pranayama class",
  "Graduation ceremony",
  "200-hour YTT group training",
  "Certified yoga teacher training",
];

function getStaticGalleryLabel(index: number) {
  return staticGalleryLabels[index] || `Bali YTTC training moment ${index + 1}`;
}

const inferGalleryCategory = (image: PublicGalleryImage): GalleryFilter => {
  if (image.category) return image.category;

  const source = `${image.url} ${image.alt || ""} ${image.caption || ""}`.toLowerCase();
  if (source.includes("villa") || source.includes("room") || source.includes("pool") || source.includes("campus") || source.includes("studio") || source.includes("reception")) return "Campus";
  if (source.includes("temple") || source.includes("ceremony") || source.includes("purification") || source.includes("graduation")) return "Ceremony";
  if (source.includes("beach") || source.includes("waterfall") || source.includes("nature")) return "Nature";
  if (source.includes("vivek") || source.includes("sachin") || source.includes("teacher")) return "Teachers";
  if (source.includes("course") || source.includes("training") || source.includes("certified") || source.includes("ytt")) return "Courses";
  return "Practice";
};

const Gallery = () => {
  const fallbackImages = useMemo<PublicGalleryImage[]>(
    () =>
      GALLERY.map((url, index) => ({
        id: `static-gallery-${index}`,
        url,
        alt: getStaticGalleryLabel(index),
        caption: getStaticGalleryLabel(index),
        category: staticGalleryCategories[index] || "Practice",
      })),
    [],
  );
  const [active, setActive] = useState<PublicGalleryImage | null>(null);
  const [images, setImages] = useState<PublicGalleryImage[]>(fallbackImages);
  const [activeFilter, setActiveFilter] = useState<GalleryFilter>("All");

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

  const galleryImages = useMemo(
    () =>
      images.map((image, index) => {
        const fallbackLabel = getStaticGalleryLabel(index);
        const rawLabel = image.caption || image.alt || fallbackLabel;
        const label = /bali yttc gallery( image)? \d+/i.test(rawLabel) ? fallbackLabel : rawLabel;

        return {
          ...image,
          alt: label,
          caption: label,
          category: inferGalleryCategory({ ...image, alt: label, caption: label }),
        };
      }),
    [images],
  );

  const filteredImages = useMemo(
    () => (activeFilter === "All" ? galleryImages : galleryImages.filter((image) => image.category === activeFilter)),
    [activeFilter, galleryImages],
  );

  return (
    <>
      <section className="pt-40 pb-12 bg-cream">
        <div className="container-edit">
          <SectionHeading
            eyebrow="Inside the ashram"
            title={<>Moments from <em className="text-terra">Ubud</em></>}
            sub="Glimpses of practice, ceremony, nature and community - captured during our trainings."
          />
          <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
            {galleryFilters.map((filter) => {
              const count = filter === "All" ? galleryImages.length : galleryImages.filter((image) => image.category === filter).length;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                    activeFilter === filter
                      ? "border-terra bg-terra text-white"
                      : "border-stone-200 bg-white text-warm-mid hover:border-terra hover:text-terra"
                  }`}
                >
                  {filter}
                  <span className={activeFilter === filter ? "ml-2 text-white/75" : "ml-2 text-warm-mid/60"}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-28 bg-cream">
        <div className="container-wide">
          <div className="mb-5 flex items-center justify-between gap-4 text-sm text-warm-mid">
            <p>
              Showing <span className="font-semibold text-warm-dark">{filteredImages.length}</span> {activeFilter === "All" ? "gallery moments" : activeFilter.toLowerCase()}
            </p>
            {activeFilter !== "All" && (
              <button type="button" onClick={() => setActiveFilter("All")} className="text-xs font-semibold uppercase tracking-[0.1em] text-terra">
                Clear filter
              </button>
            )}
          </div>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4 [&>*]:mb-3 md:[&>*]:mb-4">
            {filteredImages.map((image, i) => (
              <Reveal key={image.id} delay={(i % 8) * 0.04}>
                <button
                  onClick={() => setActive(image)}
                  className="relative block w-full break-inside-avoid rounded-md overflow-hidden group bg-sand/20 min-h-[100px]"
                >
                  <img
                    src={image.url}
                    alt={image.alt || image.caption || "Bali YTTC training moment"}
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    {image.category}
                  </span>
                  <span className="absolute inset-x-3 bottom-3 rounded-md bg-black/55 px-3 py-2 text-left text-xs font-semibold leading-5 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    {image.caption}
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-5xl bg-warm-dark border-warm-dark p-2">
          {active && (
            <div>
              <img src={active.url} alt={active.alt || active.caption || "Bali YTTC training moment"} className="w-full h-auto rounded" />
              {(active.caption || active.alt) && <p className="px-2 py-3 text-sm font-semibold text-white">{active.caption || active.alt}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Gallery;
