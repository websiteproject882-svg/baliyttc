import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { faqs } from "@/data/marketing-pages";
import { defaultLocale } from "@/i18n/routing";
import { normalizeLocale } from "@/lib/localized-content";
import prisma from "@/lib/prisma";
import { FAQPageClient, type PublicFAQItem } from "./FAQPageClient";

export const dynamic = "force-dynamic";

type FAQPageProps = {
  params: {
    locale: string;
  };
};

async function getInitialFaqs(localeParam: string): Promise<PublicFAQItem[]> {
  const locale = normalizeLocale(localeParam);

  try {
    let dbFaqs = await prisma.fAQ.findMany({
      where: { locale, isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 80,
      select: {
        question: true,
        answer: true,
        category: true,
      },
    });

    if (dbFaqs.length === 0 && locale !== defaultLocale) {
      dbFaqs = await prisma.fAQ.findMany({
        where: { locale: defaultLocale, isActive: true },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        take: 80,
        select: {
          question: true,
          answer: true,
          category: true,
        },
      });
    }

    if (dbFaqs.length > 0) {
      return dbFaqs.map((item) => ({
        category: item.category,
        q: item.question,
        a: item.answer,
      }));
    }
  } catch {
    // Static FAQs keep the page available if the CMS database is unreachable.
  }

  return faqs;
}

export default async function FAQPage({ params }: FAQPageProps) {
  const initialFaqs = await getInitialFaqs(params.locale);
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: initialFaqs.map((item) => ({
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
          <FAQPageClient initialFaqs={initialFaqs} />
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
