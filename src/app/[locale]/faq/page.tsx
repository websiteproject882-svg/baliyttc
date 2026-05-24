import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { faqs } from "@/data/marketing-pages";
import { FAQPageClient } from "./FAQPageClient";

export default function FAQPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <NextLayoutWrapper>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="bg-cream pt-36 pb-16">
        <div className="container-edit">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-leaf">Questions answered</p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-tight text-warm-dark md:text-7xl">
            Bali YTTC FAQ
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
            Clear answers about training, accommodation, food, travel, payment, certification and life after graduation.
          </p>
        </div>
      </section>
      <section className="bg-cream pb-24">
        <div className="container-edit">
          <FAQPageClient />
          <div className="mt-10 rounded-lg bg-warm-dark p-6 text-white md:flex md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Still have questions?</h2>
              <p className="mt-2 text-white/70">Admissions usually replies on WhatsApp within a few hours.</p>
            </div>
            <a href="https://wa.me/6281999333327" className="mt-5 inline-flex rounded-full bg-terra px-6 py-3 font-semibold text-white md:mt-0">
              WhatsApp us
            </a>
          </div>
        </div>
      </section>
    </NextLayoutWrapper>
  );
}
