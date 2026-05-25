"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "next/navigation";
import { localeNames, locales, usePathname, useRouter, type Locale } from "@/i18n/routing";

const LANGUAGES = locales.map((code) => ({
  code,
  name: localeNames[code],
  label: code.toUpperCase(),
}));

export const LanguageSwitcher = ({ isLightMode }: { isLightMode: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = locales.includes(params?.locale as Locale) ? (params?.locale as Locale) : "en";
  const currentLang = LANGUAGES.find((language) => language.code === currentLocale) || LANGUAGES[0];

  const handleLangChange = (langCode: Locale) => {
    setIsOpen(false);
    router.push(pathname, { locale: langCode });
  };

  const buttonBorder = isLightMode ? "1px solid rgba(28, 29, 31, 0.2)" : "1px solid rgba(255, 255, 255, 0.4)";
  const buttonColor = isLightMode ? "#1C1D1F" : "#ffffff";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        style={{
          background: "transparent",
          border: buttonBorder,
          color: buttonColor,
          fontSize: "0.6875rem",
          fontWeight: 600,
          textTransform: "uppercase",
          padding: "8px 12px",
          borderRadius: "4px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          transition: "all 0.2s ease",
        }}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span>{currentLang.code}</span>
        <span style={{ fontSize: "0.5rem", opacity: 0.8 }}>▼</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <button
              type="button"
              aria-label="Close language menu"
              className="fixed inset-0 z-[60] cursor-default"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-[70] mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-2xl"
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
                  <span className="flex items-center gap-3">
                    <span className="flex h-6 w-8 items-center justify-center rounded bg-gray-100 text-[10px] font-bold uppercase text-gray-500">
                      {language.label}
                    </span>
                    <span>{language.name}</span>
                  </span>
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
