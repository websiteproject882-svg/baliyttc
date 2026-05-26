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
        const response = await fetch(`/api/faq?locale=${encodeURIComponent(locale)}&limit=12`, { cache: "no-store" });
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
    <section id="faq" className="relative scroll-mt-28 overflow-hidden bg-white py-16 md:py-24 border-b border-stone-200/50">
      <div className="container-edit relative z-10 grid gap-10 lg:grid-cols-12 lg:gap-20">
        <div className="lg:col-span-5">
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={
              <>
                {t("title")}
                <span className="font-serif italic text-brand"> Bali</span>
              </>
            }
            sub={t("subtitle")}
          />

          <div className="relative mt-8">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-full border border-stone-200/80 bg-white py-3.5 pl-12 pr-10 text-sm shadow-[0_8px_24px_rgba(0,0,0,0.02)] transition-all focus:border-brand focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                aria-label={t("clearSearch")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {isSearching && searchQuery && (
            <p className="mt-3 text-xs text-gray-500">
              {t("resultsFor", { count: filteredFaqs.length, query: searchQuery })}
            </p>
          )}

          <div className="mt-8 space-y-4">
            <motion.a
              href={`mailto:${siteSettings.general.email}`}
              whileHover={{ y: -3, scale: 1.01 }}
              className="group flex items-center gap-4 rounded-xl border border-stone-200/50 bg-[#FAF9F6] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-brand/40 hover:bg-white hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-md">
                <Mail className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">{t("emailButton")}</p>
                <p className="mt-0.5 text-xs text-gray-500">{siteSettings.general.email}</p>
              </div>
            </motion.a>

            <motion.a
              href={`https://wa.me/${siteSettings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -3, scale: 1.01 }}
              className="group flex items-center gap-4 rounded-xl border border-stone-200/50 bg-[#FAF9F6] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-brand/40 hover:bg-white hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-md">
                <MessageCircle className="h-4 w-4 fill-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">{t("whatsappButton")}</p>
                <p className="mt-0.5 text-xs text-gray-500">{siteSettings.general.phone}</p>
              </div>
            </motion.a>
          </div>

          <div className="mt-10 hidden overflow-hidden rounded-2xl border border-stone-200/60 shadow-[0_12px_28px_rgba(0,0,0,0.04)] lg:block">
            <img
              src="https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:600/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Yoga-Teacher-Training-ceremony-bali-1.jpg"
              alt={t("imageAlt")}
              className="h-52 w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>

        <div className="lg:col-span-7 text-left">
          <Reveal>
            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-0">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem
                    key={faq.id || faq.q}
                    value={`q${index}`}
                    className="overflow-hidden bg-transparent border-b border-stone-200/60 transition-all duration-300 py-2"
                  >
                    <AccordionTrigger className="group px-1 py-4 text-left hover:no-underline">
                      <span className="flex w-full items-start gap-4">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FAF9F6] text-xs font-bold text-brand group-hover:bg-brand group-hover:text-white transition-colors duration-300">
                          {index + 1}
                        </span>
                        <span className="flex-1 font-serif text-base leading-relaxed text-gray-900 transition-colors group-hover:text-brand md:text-lg">
                          {faq.q}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-1 pb-4 pl-11 text-sm leading-relaxed text-gray-600 md:text-base">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="py-12 text-center">
                <Search className="mx-auto mb-4 h-10 w-10 text-gray-300" />
                <p className="text-gray-500">{t("noResults")} &ldquo;{searchQuery}&rdquo;</p>
                <p className="mt-2 text-sm text-gray-400">{t("contactDesc")}</p>
              </div>
            )}
          </Reveal>

          <div className="mt-10 rounded-2xl border border-stone-200/60 bg-[#FAF9F6] p-6 text-left">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-md">
                <HelpCircle className="h-4 w-4" />
              </div>
              <p className="font-semibold text-gray-900">{t("contactTitle")}</p>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-gray-500">{t("contactDesc")}</p>
            <a
              href={`mailto:${siteSettings.general.email}`}
              className="btn-primary h-10 px-6 inline-flex items-center gap-2"
            >
              <Mail className="h-3.5 w-3.5" />
              {t("emailButton")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
