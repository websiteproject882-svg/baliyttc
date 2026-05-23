"use client";

import { FAQS as STATIC_FAQS } from "@/data/site";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Mail, MessageCircle, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePublicSiteSettings } from "@/lib/use-public-site-settings";

type PublicFaq = {
  id?: string;
  q: string;
  a: string;
};

export const FAQ = () => {
  const t = useTranslations("FAQ");
  const locale = useLocale();
  const siteSettings = usePublicSiteSettings();
  const translatedFaqs = t.raw("items") as Array<{ q: string; a: string }>;
  const translatedFaqsKey = JSON.stringify(translatedFaqs ?? []);
  const fallbackFaqs = useMemo<PublicFaq[]>(() => {
    const localizedFaqs = JSON.parse(translatedFaqsKey) as PublicFaq[];
    return localizedFaqs.length ? localizedFaqs : STATIC_FAQS;
  }, [translatedFaqsKey]);
  const [faqs, setFaqs] = useState<PublicFaq[]>(fallbackFaqs);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFaqs() {
      try {
        const response = await fetch(`/api/faq?locale=${encodeURIComponent(locale)}&limit=12`);
        if (!response.ok) return;
        const data = (await response.json()) as {
          faqs?: Array<{ id: string; question: string; answer: string }>;
        };
        if (!cancelled && data.faqs?.length) {
          setFaqs(data.faqs.map((faq) => ({ id: faq.id, q: faq.question, a: faq.answer })));
        }
      } catch {
        // Keep localized fallback FAQs when admin-backed FAQs are unavailable.
      }
    }

    setFaqs(fallbackFaqs);
    loadFaqs();

    return () => {
      cancelled = true;
    };
  }, [fallbackFaqs, locale]);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const query = searchQuery.toLowerCase();
    return faqs.filter((faq) => faq.q.toLowerCase().includes(query) || faq.a.toLowerCase().includes(query));
  }, [searchQuery, faqs]);

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  return (
    <section id="faq" className="relative scroll-mt-28 overflow-hidden bg-gradient-to-b from-cream to-white py-10 md:py-12">
      <div className="container-edit relative z-10 grid gap-10 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-5">
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={
              <>
                {t("title")}
                <span className="text-sage"> Bali</span>
              </>
            }
            sub={t("subtitle")}
          />

          <div className="relative mt-8">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-2xl border-2 border-gray-100 bg-white py-4 pl-12 pr-10 text-sm shadow-premium-sm transition-colors focus:border-sage focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-ink-muted"
                aria-label={t("clearSearch")}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {isSearching && searchQuery && (
            <p className="mt-3 text-sm text-ink-muted">
              {t("resultsFor", { count: filteredFaqs.length, query: searchQuery })}
            </p>
          )}

          <div className="mt-8 space-y-4">
            <motion.a
              href={`mailto:${siteSettings.general.email}`}
              whileHover={{ y: -3, scale: 1.01 }}
              className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-premium-sm transition-all duration-300 hover:border-sage/30 hover:shadow-premium-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/20">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-charcoal">{t("emailButton")}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{siteSettings.general.email}</p>
              </div>
            </motion.a>

            <motion.a
              href={`https://wa.me/${siteSettings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -3, scale: 1.01 }}
              className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-premium-sm transition-all duration-300 hover:border-sage/30 hover:shadow-premium-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-lg">
                <MessageCircle className="h-5 w-5 fill-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-charcoal">{t("whatsappButton")}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{siteSettings.general.phone}</p>
              </div>
            </motion.a>
          </div>

          <div className="mt-10 hidden overflow-hidden rounded-2xl shadow-premium-lg lg:block">
            <img
              src="https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:600/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Yoga-Teacher-Training-ceremony-bali-1.jpg"
              alt={t("imageAlt")}
              className="h-52 w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        <div className="lg:col-span-7">
          <Reveal>
            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-3">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem
                    key={faq.id || faq.q}
                    value={`q${index}`}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-premium-sm transition-all duration-300 hover:shadow-premium-md"
                  >
                    <AccordionTrigger className="group px-6 py-5 text-left">
                      <span className="flex w-full items-start gap-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sage-mist text-sm font-bold text-sage transition-colors group-hover:bg-sage group-hover:text-white">
                          {index + 1}
                        </span>
                        <span className="flex-1 font-serif text-base leading-relaxed text-charcoal transition-colors group-hover:text-sage md:text-lg">
                          {faq.q}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pl-[4.5rem] text-sm leading-7 text-ink-soft md:text-base">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="py-12 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">{t("noResults")} &ldquo;{searchQuery}&rdquo;</p>
                <p className="mt-2 text-sm text-gray-400">{t("contactDesc")}</p>
              </div>
            )}
          </Reveal>

          <div className="mt-10 rounded-2xl border border-sage/20 bg-gradient-to-r from-sage-mist/50 to-brand-muted/30 p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage text-white">
                <HelpCircle className="h-5 w-5" />
              </div>
              <p className="font-semibold text-charcoal">{t("contactTitle")}</p>
            </div>
            <p className="mb-4 text-sm text-ink-soft">{t("contactDesc")}</p>
            <a
              href={`mailto:${siteSettings.general.email}`}
              className="inline-flex items-center gap-2 rounded-xl bg-charcoal px-5 py-2.5 text-sm font-medium text-white transition-all duration-300 hover:bg-sage hover:shadow-lg"
            >
              <Mail className="h-4 w-4" />
              {t("emailButton")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
