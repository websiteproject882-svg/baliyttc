"use client";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react";
import { usePublicSiteSettings } from "@/lib/use-public-site-settings";

export const LocationMap = () => {
  const siteSettings = usePublicSiteSettings();

  return (
    <section id="location" className="py-28 md:py-36 bg-sand">
    <div className="container-edit">
      <SectionHeading
        eyebrow="Find us in Ubud"
        title={<>Our ashram in <em className="text-terra">Bali</em></>}
        sub="Tucked into a quiet corner of Ubud, surrounded by jungle, rice fields and the gentle sound of the river."
      />

      <div className="mt-14 grid lg:grid-cols-12 gap-8">
        <Reveal className="lg:col-span-8">
          <div className="rounded-lg overflow-hidden shadow-elev-md aspect-[16/10] border border-warm-dark/10 bg-warm-dark">
            <iframe
              title="Bali YTTC location"
              src={siteSettings.mapsEmbedUrl}
              width="100%" height="100%" loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-4">
          <div className="bg-cream rounded-lg p-8 h-full border border-warm-dark/8 flex flex-col">
            <p className="eyebrow text-terra mb-5">Visit / Call / Write</p>
            <div className="space-y-5 flex-1">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-terra mt-0.5 shrink-0" />
                <div>
                  <p className="text-warm-dark font-medium">Address</p>
                  <p className="text-sm text-ink-soft mt-1">{siteSettings.general.address}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="w-5 h-5 text-terra mt-0.5 shrink-0" />
                <div>
                  <p className="text-warm-dark font-medium">Phone</p>
                  <p className="text-sm text-ink-soft mt-1">{siteSettings.general.phone}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Mail className="w-5 h-5 text-terra mt-0.5 shrink-0" />
                <div>
                  <p className="text-warm-dark font-medium">Email</p>
                  <p className="text-sm text-ink-soft mt-1">{siteSettings.general.email}</p>
                </div>
              </div>
            </div>
            <a
              href={siteSettings.mapsLinkUrl} target="_blank" rel="noopener"
              className="mt-8 inline-flex items-center justify-center gap-2 bg-warm-dark text-cream py-3 rounded-md hover:bg-warm-mid transition-colors text-sm font-medium"
            >
              Get directions <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
  );
};

