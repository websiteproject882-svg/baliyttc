"use client";
import { FAQS as STATIC_FAQS, SITE as STATIC_SITE } from "@/data/site";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Mail, MessageCircle, Search, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";

const faqByLocale: Record<string, Array<{ q: string; a: string }>> = {
  es: [
    { q: "¿Qué es Bali YTTC?", a: "Una escuela certificada por Yoga Alliance en Ubud, Bali, con formaciones de 100, 200 y 300 horas." },
    { q: "¿Qué visa necesito?", a: "La mayoría usa VOA o B211A. Te orientamos según la duración de tu estancia." },
    { q: "¿Qué debo llevar?", a: "Ropa cómoda de yoga, protector solar, repelente y una mente abierta." },
  ],
  de: [
    { q: "Was ist Bali YTTC?", a: "Eine Yoga Alliance zertifizierte Schule in Ubud mit 100h, 200h und 300h Ausbildungen." },
    { q: "Welches Visum brauche ich?", a: "Meist VOA oder B211A. Wir beraten je nach Aufenthaltsdauer." },
    { q: "Was soll ich mitbringen?", a: "Bequeme Yogakleidung, Sonnenschutz, Mückenschutz und Offenheit." },
  ],
  fr: [
    { q: "Qu'est-ce que Bali YTTC ?", a: "Une école certifiée Yoga Alliance à Ubud avec formations 100h, 200h et 300h." },
    { q: "Quel visa faut-il ?", a: "La plupart des étudiants utilisent VOA ou B211A. Nous vous guidons selon la durée." },
    { q: "Que dois-je apporter ?", a: "Tenues de yoga, crème solaire, répulsif et un esprit ouvert." },
  ],
  ko: [
    { q: "Bali YTTC는 무엇인가요?", a: "우붓에 있는 Yoga Alliance 인증 학교로 100, 200, 300시간 과정을 제공합니다." },
    { q: "어떤 비자가 필요한가요?", a: "대부분 VOA 또는 B211A를 사용합니다. 체류 기간에 따라 안내해 드립니다." },
    { q: "무엇을 준비해야 하나요?", a: "편한 요가복, 선크림, 모기 퇴치제, 열린 마음을 준비하세요." },
  ],
  zh: [
    { q: "Bali YTTC是什么？", a: "位于乌布的Yoga Alliance认证学校，提供100、200和300小时培训。" },
    { q: "我需要什么签证？", a: "多数学生使用VOA或B211A。我们会根据停留时间提供建议。" },
    { q: "需要带什么？", a: "舒适瑜伽服、防晒、驱蚊用品和开放的心态。" },
  ],
  ja: [
    { q: "Bali YTTCとは？", a: "ウブドにあるYoga Alliance認定校で、100・200・300時間コースを提供しています。" },
    { q: "どのビザが必要ですか？", a: "多くの学生はVOAまたはB211Aを利用します。滞在期間に応じて案内します。" },
    { q: "何を持参すればよいですか？", a: "動きやすいヨガウェア、日焼け止め、虫除け、学ぶ姿勢をお持ちください。" },
  ],
  ru: [
    { q: "Что такое Bali YTTC?", a: "Сертифицированная Yoga Alliance школа в Убуде с курсами 100, 200 и 300 часов." },
    { q: "Какая виза нужна?", a: "Обычно VOA или B211A. Мы подскажем вариант по сроку пребывания." },
    { q: "Что взять с собой?", a: "Удобную одежду для йоги, солнцезащитный крем, репеллент и открытый настрой." },
  ],
};

export const FAQ = () => {
  const t = useTranslations("FAQ");
  const locale = useLocale();
  const faqs = faqByLocale[locale] || STATIC_FAQS;
  const site = STATIC_SITE;
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqs;
    const query = searchQuery.toLowerCase();
    return faqs.filter(
      (faq) =>
        faq.q.toLowerCase().includes(query) ||
        faq.a.toLowerCase().includes(query)
    );
  }, [searchQuery, faqs]);

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  return (
    <section id="faq" className="relative scroll-mt-28 overflow-hidden bg-gradient-to-b from-cream to-white py-10 md:py-12">
      <div className="container-edit relative z-10 grid gap-10 lg:grid-cols-12 lg:gap-20">
        {/* Left Column */}
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

          {/* Search Bar - Premium style */}
          <div className="mt-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-12 pr-10 py-4 rounded-2xl border-2 border-gray-100 bg-white text-sm focus:outline-none focus:border-sage transition-colors shadow-premium-sm"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Search Results Count */}
          {isSearching && searchQuery && (
            <p className="mt-3 text-sm text-ink-muted">
              {filteredFaqs.length} results for &ldquo;{searchQuery}&rdquo;
            </p>
          )}

          {/* Contact Cards */}
          <div className="mt-8 space-y-4">
            <motion.a
              href={`mailto:${site.email}`}
              whileHover={{ y: -3, scale: 1.01 }}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-premium-sm transition-all duration-300 hover:border-sage/30 hover:shadow-premium-md group"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/20">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-charcoal text-sm">{t("emailButton")}</p>
                <p className="text-xs text-ink-muted mt-0.5">{site.email}</p>
              </div>
            </motion.a>

            <motion.a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -3, scale: 1.01 }}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-premium-sm transition-all duration-300 hover:border-sage/30 hover:shadow-premium-md group"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-lg">
                <MessageCircle className="h-5 w-5 fill-white" />
              </div>
              <div>
                <p className="font-semibold text-charcoal text-sm">{t("whatsappButton")}</p>
                <p className="text-xs text-ink-muted mt-0.5">{site.phone}</p>
              </div>
            </motion.a>
          </div>

          {/* Decorative image */}
          <div className="mt-10 hidden lg:block rounded-2xl overflow-hidden shadow-premium-lg">
            <img
              src="https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:600/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Yoga-Teacher-Training-ceremony-bali-1.jpg"
              alt="Bali YTTC ceremony"
              className="w-full h-52 object-cover"
              loading="lazy"
            />
          </div>
        </div>

        {/* Right Column - Accordion */}
        <div className="lg:col-span-7">
          <Reveal>
            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-3">
                {filteredFaqs.map((faq, index) => (
                  <AccordionItem
                    key={faq.q}
                    value={`q${index}`}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-premium-sm transition-all duration-300 hover:shadow-premium-md"
                  >
                    <AccordionTrigger className="px-6 py-5 text-left group">
                      <span className="flex w-full items-start gap-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sage-mist text-sm font-bold text-sage group-hover:bg-sage group-hover:text-white transition-colors">
                          {index + 1}
                        </span>
                        <span className="flex-1 font-serif text-base text-charcoal leading-relaxed group-hover:text-sage transition-colors md:text-lg">
                          {faq.q}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 text-sm leading-7 text-ink-soft md:text-base pl-[4.5rem]">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t("noResults")} &ldquo;{searchQuery}&rdquo;</p>
                <p className="text-sm text-gray-400 mt-2">{t("contactDesc")}</p>
              </div>
            )}
          </Reveal>

          {/* Still have questions */}
          <div className="mt-10 rounded-2xl bg-gradient-to-r from-sage-mist/50 to-brand-muted/30 border border-sage/20 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage text-white">
                <HelpCircle className="h-5 w-5" />
              </div>
              <p className="font-semibold text-charcoal">{t("contactTitle")}</p>
            </div>
            <p className="mb-4 text-sm text-ink-soft">
              {t("contactDesc")}
            </p>
            <a
              href={`mailto:${site.email}`}
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
