"use client";

import { useEffect, useState } from "react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { StickyBar } from "./StickyBar";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";
import { ApplyModal } from "@/components/shared/ApplyModal";
import { WhatsAppChat } from "@/components/shared/WhatsAppChat";
import { usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";

const BANNER_H = 40;

export const NextLayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash) return false;

      window.setTimeout(() => {
        const target = document.querySelector(hash);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);

      return true;
    };

    if (scrollToHash()) {
      return;
    }

    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const target = document.querySelector(hash);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="bg-cream min-h-screen flex flex-col">
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-0 top-0 z-[70] overflow-hidden bg-gradient-to-r from-[#2D5A27] via-[#4A7C4F] to-[#2D5A27]"
            style={{ height: `${BANNER_H}px` }}
          >
            <div className="container-wide h-full flex items-center justify-between gap-4">
              <div className="flex-1 flex items-center justify-center gap-2.5 text-xs font-medium">
                <span className="text-white/90">
                  {t("welcome")}
                </span>
              </div>
              <button
                onClick={() => setShowBanner(false)}
                className="flex-shrink-0 text-white/60 hover:text-white transition-colors p-0.5"
                aria-label="Close banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Nav bannerHeight={showBanner ? BANNER_H : 0} />

      <main className="flex-1">
        {children}
      </main>

      <Footer />
      <StickyBar />
      <WhatsAppChat />
    </div>
  );
};
