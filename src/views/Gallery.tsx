import { GALLERY } from "@/data/site";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

const Gallery = () => {
  const [active, setActive] = useState<string | null>(null);
  const images = GALLERY;

  return (
    <>
      <section className="pt-40 pb-12 bg-cream">
        <div className="container-edit">
          <SectionHeading
            eyebrow="Inside the ashram"
            title={<>Moments from <em className="text-terra">Ubud</em></>}
            sub="Glimpses of practice, ceremony, nature and community — captured during our trainings."
          />
        </div>
      </section>

      <section className="pb-28 bg-cream">
        <div className="container-wide">
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4 [&>*]:mb-3 md:[&>*]:mb-4">
            {images.map((src, i) => (
              <Reveal key={src + i} delay={(i % 8) * 0.04}>
                <button
                  onClick={() => setActive(src)}
                  className="block w-full break-inside-avoid rounded-md overflow-hidden group bg-sand/20 min-h-[100px]"
                >
                  <img src={src} alt="" className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-5xl bg-warm-dark border-warm-dark p-2">
          {active && <img src={active} alt="" className="w-full h-auto rounded" />}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Gallery;
