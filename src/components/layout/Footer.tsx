"use client";
import { useState } from "react";
import { Link } from "@/i18n/routing";
import { Facebook, Instagram, Mail, MapPin, Youtube, ArrowUpRight, Heart } from "lucide-react";
import { BalieytcLogo } from "@/components/shared/BalieytcLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { usePublicSiteSettings } from "@/lib/use-public-site-settings";

const footerLinks = [
  {
    titleKey: "programs",
    links: [
      { labelKey: "course100", to: "/courses/100hr" },
      { labelKey: "course200", to: "/courses/200hr" },
      { labelKey: "course300", to: "/courses/300hr" },
      { labelKey: "gallery", to: "/gallery" },
    ],
  },
  {
    titleKey: "school",
    links: [
      { labelKey: "about", to: "/about" },
      { labelKey: "teachers", to: "/instructors" },
      { labelKey: "testimonials", to: "/testimonials" },
      { labelKey: "contact", to: "/contact" },
    ],
  },
];

export const Footer = () => {
  const t = useTranslations("Navigation");
  const tFooter = useTranslations("Footer");
  const siteSettings = usePublicSiteSettings();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Social media links - update these with real URLs
  const socials = {
    instagram: "https://www.instagram.com/baliyttc/",
    facebook: "https://www.facebook.com/baliyttc",
    youtube: "https://www.youtube.com/@baliyttc",
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubscribing(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Newsletter subscriber",
          email,
          source: "newsletter-footer",
          course: "Newsletter",
          message: "Subscribed from the website footer newsletter form.",
          website: "",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Could not subscribe right now.");
      }
      toast({
        title: tFooter("newsletterSuccess"),
        description: tFooter("newsletterDesc"),
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="bg-[#1C1208] pt-20 pb-8 text-[#F0D5B0]">
      <div className="container-wide">
        {/* Top Grid */}
        <div className="grid gap-12 lg:grid-cols-12 pb-14 border-b border-[#F0D5B0]/20">
          {/* Brand col */}
          <div className="lg:col-span-4">
            <div className="mb-5 flex items-center gap-3">
              <BalieytcLogo
                className="h-12 w-12"
                showText={false}
                logoUrl={siteSettings.logoUrl}
                siteName={siteSettings.general.schoolName}
              />
              <div>
                <p className="font-serif text-xl font-bold text-[#FFFDF7]">{siteSettings.general.schoolName}</p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#F0D5B0]/60">
                  {siteSettings.general.tagline || tFooter("tagline")}
                </p>
              </div>
            </div>
            <p className="text-[#F0D5B0]/80 mb-6">{tFooter("description")}</p>

            {/* Social Links */}
            <div className="flex gap-3">
              <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#1C1208]/80 border border-[#F0D5B0]/30 text-[#F0D5B0] hover:bg-[#E8742A] hover:text-[#FFFDF7] hover:border-[#E8742A] flex items-center justify-center transition-all duration-300">
                <Instagram className="h-5 w-5" />
              </a>
              <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#1C1208]/80 border border-[#F0D5B0]/30 text-[#F0D5B0] hover:bg-[#E8742A] hover:text-[#FFFDF7] hover:border-[#E8742A] flex items-center justify-center transition-all duration-300">
                <Facebook className="h-5 w-5" />
              </a>
              <a href={socials.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#1C1208]/80 border border-[#F0D5B0]/30 text-[#F0D5B0] hover:bg-[#E8742A] hover:text-[#FFFDF7] hover:border-[#E8742A] flex items-center justify-center transition-all duration-300">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {footerLinks.map((column) => (
              <div key={column.titleKey}>
                <h4 className="font-bold text-[#FFFDF7] uppercase text-sm tracking-wider mb-4">{t(column.titleKey)}</h4>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link.labelKey}>
                      <Link href={link.to} className="text-[#F0D5B0]/80 hover:text-[#E8742A] transition-colors text-sm">
                        {t(link.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Contact Column */}
            <div>
              <h4 className="font-bold text-[#FFFDF7] uppercase text-sm tracking-wider mb-4">{tFooter("contact")}</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-[#E8742A] shrink-0" />
                  <span>{siteSettings.general.address}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#E8742A] shrink-0" />
                  <a href={`mailto:${siteSettings.general.email}`} className="hover:text-[#E8742A] transition-colors">
                    {siteSettings.general.email}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="py-10 border-b border-[#F0D5B0]/20">
          <div className="max-w-md">
            <h4 className="font-bold text-[#FFFDF7] mb-2">{tFooter("newsletter")}</h4>
            <p className="text-[#F0D5B0]/80 text-sm mb-4">{tFooter("newsletterDesc")}</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <Input
                type="email"
                placeholder={tFooter("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#1C1208] border-[#F0D5B0]/30 text-[#FFFDF7] placeholder:text-[#F0D5B0]/50"
              />
              <Button type="submit" disabled={isSubscribing} className="bg-[#E8742A] hover:bg-[#F4A44A] text-white rounded-[12px] disabled:opacity-70">
                {isSubscribing ? "Saving..." : tFooter("subscribe")}
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#F0D5B0]/60 text-sm">
            &copy; {new Date().getFullYear()} {siteSettings.general.schoolName}. {tFooter("rights")}
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/terms" className="text-[#F0D5B0]/60 hover:text-[#E8742A] transition-colors">{tFooter("terms")}</Link>
            <Link href="/terms" className="text-[#F0D5B0]/60 hover:text-[#E8742A] transition-colors">{tFooter("privacy")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
