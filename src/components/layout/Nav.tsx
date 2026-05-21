"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname as useLocation } from "@/i18n/routing";
import { ApplyModal } from "@/components/shared/ApplyModal";
import { SITE } from "@/data/site";
import { LanguageSwitcher } from "./LanguageSwitcher";

const menuColumns = [
  {
    title: "Trainings",
    links: [
      { label: "All Trainings", to: "/#courses", strong: true },
      { label: "100hr Foundation", to: "/courses/100hr" },
      { label: "200hr Yoga Teacher Training", to: "/courses/200hr" },
      { label: "300hr Advanced", to: "/courses/300hr" },
      { label: "Retreats", to: "/retreats", strong: true },
      { label: "Short Courses", to: "/workshops" },
    ],
  },
  {
    title: "Experience",
    links: [
      { label: "Activities", to: "/activities", strong: true },
      { label: "Gallery", to: "/gallery" },
      { label: "Testimonials", to: "/testimonials" },
      { label: "Youtube Videos", to: "/videos" },
      { label: "Blog", to: "/blog" },
    ],
  },
  {
    title: "Plan Your Trip",
    links: [
      { label: "Pricing & Fees", to: "/pricing", strong: true },
      { label: "Visa Information", to: "/visa" },
      { label: "FAQ", to: "/#faq" },
      { label: "Contact Us", to: "/contact" },
      { label: SITE.email, href: `mailto:${SITE.email}` },
    ],
  },
  {
    title: "School",
    links: [
      { label: "About Bali YTTC", to: "/about", strong: true },
      { label: "Teachers", to: "/instructors" },
      { label: "Yoga Alliance", to: "/yoga-alliance" },
      { label: "Student Reviews", to: "/testimonials" },
      { label: "Terms & Policy", to: "/terms" },
    ],
  },
];

export const Nav = ({ bannerHeight = 0 }: { bannerHeight?: number }) => {
  const t = useTranslations("Navigation");
  const locale = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useLocation();
  const onHome = pathname === "/";
  const NAV_H = 64;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isLightMode = scrolled || !onHome || menuOpen;
  const textClass = isLightMode ? "text-gray-900" : "text-white";
  const iconClass = isLightMode ? "text-gray-900 hover:bg-gray-100" : "text-white hover:bg-white/10";
  const desktopLinkClass = isLightMode ? "text-gray-800 hover:text-brand" : "text-white hover:text-white";
  const desktopPanelClass = isLightMode
    ? "border-gray-100 bg-white text-gray-900 shadow-premium-lg"
    : "border-white/20 bg-neutral-950/95 text-white shadow-[0_24px_70px_rgba(0,0,0,0.55)] ring-1 ring-white/10";
  const desktopPanelSubClass = isLightMode ? "text-gray-500" : "text-white/75";
  const desktopPanelItemClass = isLightMode
    ? "hover:bg-sage-mist/50 hover:text-sage"
    : "hover:bg-white/10 hover:text-white";

  const programLinks = [
    { label: t("course100"), description: "Foundation training", to: "/courses/100hr" },
    { label: t("course200"), description: "Flagship certification", to: "/courses/200hr" },
    { label: t("course300"), description: "Advanced teacher path", to: "/courses/300hr" },
    { label: "50-Hour Hatha-Vinyasa YTT", description: "Short course", to: "/courses/50hr" },
  ];

  const experienceLinks = [
    { label: t("activities"), description: "Workshops, ceremonies and Bali culture", to: "/activities" },
    { label: t("gallery"), description: "Student moments and campus life", to: "/gallery" },
    { label: t("testimonials"), description: "Real student reviews", to: "/testimonials" },
    { label: t("videos"), description: "Campus and alumni video journals", to: "/videos" },
  ];

  const localizedMenuHref = (to = "/") => (to.startsWith("/") ? `/${locale}${to}` : to);

  return (
    <>
      <header
        style={{ top: `${bannerHeight}px` }}
        className={`fixed inset-x-0 z-50 transition-all duration-300 ${
          isLightMode
            ? "border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur-md"
            : "border-b border-white/10 bg-black/55 shadow-[0_10px_40px_rgba(0,0,0,0.28)] backdrop-blur-md"
        }`}
      >
        {scrolled && (
          <div className="bg-gradient-to-r from-brand-dark to-brand py-1.5 text-center text-xs font-medium text-white">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
              {t("scarcity")}
              <a href="/courses/200hr" className="ml-1 font-bold underline hover:text-amber-200">
                {t("applyNow")}
              </a>
            </span>
          </div>
        )}

        <div className="container-wide" style={{ height: `${NAV_H}px` }}>
          <div className="relative flex h-full items-center justify-between gap-4">
            <Link href="/" className="group absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 shrink-0 items-center gap-3 transition-opacity hover:opacity-95">
              <img
                src="/images/brand/logo-full.png"
                alt="Bali YTTC"
                className="h-auto w-[120px] flex-shrink-0 drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)] sm:w-[140px]"
                loading="eager"
                decoding="async"
              />
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
              <div className="group relative">
                <button
                  type="button"
                  className={`inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-extrabold uppercase tracking-[0.12em] transition-colors ${desktopLinkClass}`}
                >
                  {t("trainings")}
                  <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                </button>
                <div className="invisible absolute left-0 top-full z-50 w-[320px] translate-y-2 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className={`rounded-xl border p-2 ${desktopPanelClass}`}>
                    <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] ${desktopPanelSubClass}`}>
                      {t("trainings")}
                    </div>
                    {programLinks.map((item) => (
                      <Link
                        key={item.to}
                        href={item.to}
                        className={`block rounded-lg px-3 py-2.5 transition-colors ${desktopPanelItemClass}`}
                      >
                        <span className="block text-sm font-bold">{item.label}</span>
                        <span className={`mt-0.5 block text-xs ${desktopPanelSubClass}`}>{item.description}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="group relative">
                <button
                  type="button"
                  className={`inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-extrabold uppercase tracking-[0.12em] transition-colors ${desktopLinkClass}`}
                >
                  {t("experience")}
                  <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                </button>
                <div className="invisible absolute left-0 top-full z-50 w-[320px] translate-y-2 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className={`rounded-xl border p-2 ${desktopPanelClass}`}>
                    <div className={`px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] ${desktopPanelSubClass}`}>
                      {t("experience")}
                    </div>
                    {experienceLinks.map((item) => (
                      <Link
                        key={item.to}
                        href={item.to}
                        className={`block rounded-lg px-3 py-2.5 transition-colors ${desktopPanelItemClass}`}
                      >
                        <span className="block text-sm font-bold">{item.label}</span>
                        <span className={`mt-0.5 block text-xs ${desktopPanelSubClass}`}>{item.description}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <LanguageSwitcher isLightMode={isLightMode} />
              <Link
                href="/login"
                className={`hidden h-9 items-center gap-1.5 rounded-full border-2 px-5 text-sm font-semibold transition-all duration-300 sm:inline-flex ${
                  isLightMode
                    ? "border-brand text-brand hover:bg-brand hover:text-white"
                    : "border-white text-white hover:bg-white hover:text-brand"
                }`}
              >
                {t("login")}
              </Link>
              <ApplyModal
                trigger={
                  <button className="hidden h-9 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-brand-dark hover:shadow-md sm:inline-flex">
                    {t("applyNow")} <span aria-hidden>→</span>
                  </button>
                }
              />
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${iconClass}`}
                aria-label="Menu"
              >
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
              top: `${bannerHeight + NAV_H}px`,
              maxHeight: `calc(100vh - ${bannerHeight + NAV_H}px)`,
            }}
            className="fixed inset-x-0 z-40 overflow-y-auto border-t border-gray-100 bg-white shadow-2xl"
          >
            <div className="container-wide grid gap-8 py-10 md:grid-cols-4 md:gap-12 md:py-14">
              {menuColumns.map((column) => (
                <div key={column.title}>
                  <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">
                    {column.title}
                  </p>
                  <div className="space-y-3.5">
                    {column.links.map((link) => {
                      const cls = link.strong
                        ? "block text-sm font-bold text-gray-900 transition-colors hover:text-[#F04E23]"
                        : "block text-sm leading-6 text-gray-600 transition-all hover:pl-1 hover:text-gray-900";
                      if (link.href) {
                        return (
                          <a
                            key={link.label}
                            href={link.href}
                            target={link.href.startsWith("http") ? "_blank" : undefined}
                            rel="noopener"
                            onClick={() => setMenuOpen(false)}
                            className={cls}
                          >
                            {link.label}
                          </a>
                        );
                      }
                      return (
                        <a key={link.label} href={localizedMenuHref(link.to)} onClick={() => setMenuOpen(false)} className={cls}>
                          {link.label}
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 bg-gray-50 py-4">
              <div className="container-wide flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-gray-500">
                  {t("needHelp")}{" "}
                  <a href={`tel:${SITE.phone}`} className="font-bold text-[#F04E23] transition-colors hover:text-[#D03D12]">
                    {SITE.phone}
                  </a>
                </p>
                <ApplyModal
                  trigger={
                    <button className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-brand-dark hover:shadow-md">
                      {t("applyBatch")} →
                    </button>
                  }
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
