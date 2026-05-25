import Image from "next/image";
import { BedDouble, Fan, Leaf, ShieldCheck, Sparkles, Waves, Wifi } from "lucide-react";
import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { accommodationImages } from "@/data/marketing-pages";
import { getPageCopy } from "@/lib/page-i18n";

const amenityIcons = [Waves, Sparkles, Leaf, Wifi, ShieldCheck, Fan];

export default function AccommodationPage({ params }: { params: { locale: string } }) {
  const copy = getPageCopy(params.locale, "accommodation");
  return (
    <NextLayoutWrapper>
      <section className="bg-cream pt-36 pb-16">
        <div className="container-edit grid gap-10 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-leaf">{copy.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-tight text-warm-dark md:text-7xl">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
              {copy.intro}
            </p>
          </div>
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-warm-dark">{copy.includedTitle}</p>
            <p className="mt-2 text-sm leading-7 text-ink-soft">{copy.includedText}</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-edit grid gap-6 lg:grid-cols-2">
          <RoomCard
            title={copy.sharedTitle}
            price={copy.sharedPrice}
            items={copy.sharedItems}
          />
          <RoomCard
            title={copy.privateTitle}
            price={copy.privatePrice}
            items={copy.privateItems}
          />
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="container-edit">
          <h2 className="text-3xl font-bold text-warm-dark">{copy.amenitiesTitle}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {copy.amenities.map((label, index) => {
              const Icon = amenityIcons[index] || Sparkles;
              return (
              <div key={label} className="rounded-lg border border-sand bg-white p-5">
                <Icon className="h-6 w-6 text-terra" />
                <p className="mt-4 font-semibold text-warm-dark">{label}</p>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-edit grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-leaf">{copy.mealsEyebrow}</p>
            <h2 className="mt-4 text-3xl font-bold text-warm-dark">{copy.mealsTitle}</h2>
            <p className="mt-5 leading-8 text-ink-soft">
              {copy.mealsText}
            </p>
          </div>
          <ul className="space-y-3 rounded-lg bg-cream p-6 text-sm text-ink-soft">
            {copy.mealItems.map((item) => (
              <li key={item} className="flex gap-3"><Leaf className="h-5 w-5 text-leaf" />{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-cream pb-24">
        <div className="container-edit">
          <h2 className="text-3xl font-bold text-warm-dark">{copy.gallery}</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {accommodationImages.map((src, index) => (
              <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-sand">
                <Image src={src} alt={`Bali YTTC accommodation ${index + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </NextLayoutWrapper>
  );
}

function RoomCard({ title, price, items }: { title: string; price: string; items: string[] }) {
  return (
    <article className="rounded-lg border border-sand bg-cream p-6">
      <BedDouble className="h-7 w-7 text-terra" />
      <div className="mt-5 flex items-start justify-between gap-4">
        <h2 className="text-2xl font-bold text-warm-dark">{title}</h2>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-leaf">{price}</span>
      </div>
      <ul className="mt-5 space-y-3 text-sm text-ink-soft">
        {items.map((item) => <li key={item}>- {item}</li>)}
      </ul>
    </article>
  );
}
