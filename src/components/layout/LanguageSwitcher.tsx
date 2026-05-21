"use client";

import { useState } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, Locale } from "@/i18n/routing";
import { useParams } from "next/navigation";

const LANGUAGES: { code: Locale; name: string; label: string }[] = [
  { code: "en", name: "English", label: "EN" },
  { code: "es", name: "Español", label: "ES" },
  { code: "de", name: "Deutsch", label: "DE" },
  { code: "ko", name: "한국어", label: "KO" },
  { code: "zh", name: "中文", label: "ZH" },
  { code: "ja", name: "日本語", label: "JA" },
  { code: "fr", name: "Français", label: "FR" },
  { code: "ru", name: "Русский", label: "RU" },
];

export const LanguageSwitcher = ({ isLightMode }: { isLightMode: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as Locale) || "en";
  const currentLang = LANGUAGES.find((language) => language.code === currentLocale) || LANGUAGES[0];

  const handleLangChange = (langCode: Locale) => {
    setIsOpen(false);
    router.push(pathname, { locale: langCode });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 transition-all duration-200 ${
          isLightMode
            ? "text-gray-700 hover:bg-gray-100"
            : "text-white/90 hover:bg-white/10"
        }`}
        aria-label="Select language"
      >
        <Globe size={16} className={isLightMode ? "text-[#F04E23]" : "text-white"} />
        <span className="text-xs font-bold uppercase tracking-wider">{currentLang.code}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-[70] mt-2 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-2xl"
            >
              <div className="mb-1 border-b border-gray-50 px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Select Language</span>
              </div>
              {LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  onClick={() => handleLangChange(language.code)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    currentLocale === language.code
                      ? "bg-orange-50 font-bold text-[#F04E23]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-7 items-center justify-center rounded bg-gray-100 text-[10px] font-bold text-gray-500">
                      {language.label}
                    </span>
                    <span>{language.name}</span>
                  </div>
                  {currentLocale === language.code && <Check size={14} />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
