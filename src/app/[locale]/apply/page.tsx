import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { ApplyPageClient } from "./ApplyPageClient";

export default function ApplyPage() {
  return (
    <NextLayoutWrapper>
      <section className="bg-cream pt-36 pb-16">
        <div className="container-edit">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-leaf">Apply for 2026 batch</p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl leading-tight text-warm-dark md:text-7xl">
            Secure your spot at Bali YTTC
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
            Share your details and preferred training date. Our admissions team will confirm availability, answer questions and guide the deposit step.
          </p>
        </div>
      </section>
      <section className="bg-cream pb-24">
        <div className="container-edit">
          <ApplyPageClient />
        </div>
      </section>
    </NextLayoutWrapper>
  );
}
