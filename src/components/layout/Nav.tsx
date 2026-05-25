"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname as useLocation } from "@/i18n/routing";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { usePublicSiteSettings } from "@/lib/use-public-site-settings";

type MenuLink = {
  label: string;
  to?: string;
  href?: string;
  strong?: boolean;
};

type MenuColumn = {
  title: string;
  links: MenuLink[];
};

export const Nav = ({ bannerHeight = 0 }: { bannerHeight?: number }) => {
  const t = useTranslations("Navigation");
  const siteSettings = usePublicSiteSettings();
  const locale = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useLocation();
  const onHome = pathname === "/";
  const NAV_H = 76; // Match reference site navigation bar height exactly

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

  const localizedMenuHref = (to = "/") => (to.startsWith("/") ? `/${locale}${to}` : to);

  // Layout Link definitions aligned with the 4 columns in the reference site
  const menuColumns: MenuColumn[] = [
    {
      title: t("trainings"),
      links: [
        { label: t("allTrainings"), to: "/#courses", strong: true },
        { label: t("course100"), to: "/courses/100hr" },
        { label: t("course200"), to: "/courses/200hr" },
        { label: t("course300"), to: "/courses/300hr" },
        { label: t("retreats"), to: "/retreats", strong: true },
        { label: "Short Courses", to: "/courses/50hr" },
      ],
    },
    {
      title: t("experience"),
      links: [
        { label: t("activities"), to: "/activities", strong: true },
        { label: "Accommodation", to: "/accommodation" },
        { label: t("gallery"), to: "/gallery" },
        { label: "Asana Guide", to: "/gallery" }, // Safe fallback to gallery
        { label: t("testimonials"), to: "/testimonials" },
        { label: t("blog"), to: "/blog" },
      ],
    },
    {
      title: t("planYourTrip"),
      links: [
        { label: t("pricing"), to: "/pricing", strong: true },
        { label: t("videos"), to: "/videos" },
        { label: t("visa"), to: "/visa" },
        { label: t("faq"), to: "/#faq" },
        { label: t("contact"), to: "/contact" },
        { label: siteSettings.general.email, href: `mailto:${siteSettings.general.email}` },
      ],
    },
    {
      title: t("school"),
      links: [
        { label: t("aboutUs"), to: "/about", strong: true },
        { label: t("teachers"), to: "/instructors" },
        { label: t("yogaAlliance"), to: "/yoga-alliance" },
        { label: t("reviews"), to: "/testimonials" },
        { label: t("terms"), to: "/terms" },
      ],
    },
  ];

  // Scrolled vs Transparent styles mapping
  const navStyle = isLightMode
    ? {
        background: "rgba(249, 247, 244, 0.98)",
        boxShadow: "0 4px 24px rgba(44, 74, 46, 0.08)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(44, 74, 46, 0.08)",
      }
    : {
        background: "transparent",
        boxShadow: "none",
        backdropFilter: "none",
        borderBottom: "none",
      };

  const textStyleColor = isLightMode ? "#1C1D1F" : "#ffffff";
  const subtitleColor = isLightMode ? "rgba(28, 29, 31, 0.65)" : "rgba(255, 255, 255, 0.65)";
  const hamburgerBgColor = isLightMode ? "#1C1D1F" : "#ffffff";

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: `${bannerHeight}px`,
          left: 0,
          right: 0,
          zIndex: 100,
          height: `${NAV_H}px`,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          padding: "0 40px",
          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          ...navStyle,
        }}
        className="nav-bar-container"
      >
        {/* LEFT COLUMN: HAMBURGER MENU TOGGLE */}
        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 0",
              zIndex: 101,
            }}
            aria-label="Toggle menu"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span
                style={{
                  display: "block",
                  width: "22px",
                  height: "1.5px",
                  background: hamburgerBgColor,
                  borderRadius: "2px",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  transformOrigin: "center",
                  transform: menuOpen ? "translateY(7.5px) rotate(45deg)" : "none",
                }}
              ></span>
              <span
                style={{
                  display: "block",
                  width: "22px",
                  height: "1.5px",
                  background: hamburgerBgColor,
                  borderRadius: "2px",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  transformOrigin: "center",
                  opacity: menuOpen ? 0 : 1,
                  transform: menuOpen ? "scale(0)" : "none",
                }}
              ></span>
              <span
                style={{
                  display: "block",
                  width: "22px",
                  height: "1.5px",
                  background: hamburgerBgColor,
                  borderRadius: "2px",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  transformOrigin: "center",
                  transform: menuOpen ? "translateY(-7.5px) rotate(-45deg)" : "none",
                }}
              ></span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: textStyleColor,
                transition: "color 0.3s ease",
              }}
              className="menu-label-text"
            >
              {menuOpen ? "Close" : "Menu"}
            </span>
          </button>
        </div>

        {/* CENTER COLUMN: CIRCULAR LOGO BRAND */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Link style={{ textDecoration: "none" }} className="navbar-brand-logo" href="/">
            <div
              style={{ display: "flex", alignItems: "center", gap: "10px", userSelect: "none" }}
              className="brand-logo-container"
            >
              <div className="brand-logo-wrap">
                <img
                  alt={siteSettings.general.schoolName}
                  src={siteSettings.logoUrl}
                  className="brand-logo-img"
                  style={{ color: "transparent" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
                <span className="logo-title" style={{ color: textStyleColor }}>
                  {siteSettings.general.schoolName}
                </span>
                <span className="logo-subtitle" style={{ color: subtitleColor }}>
                  Yoga Teacher Training
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* RIGHT COLUMN: DROPDOWNS, LANGBAR, APPLY BUTTON */}
        <div
          style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "20px" }}
          className="navbar-right-section"
        >
          <div className="desktop-links" style={{ display: "flex", gap: "28px", alignItems: "center" }}>
            <div className="nav-dropdown-trigger">
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: isLightMode ? "rgba(28, 29, 31, 0.95)" : "rgba(255, 255, 255, 0.95)",
                  transition: "color 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                className="nav-hover-accent"
              >
                Programs<span style={{ fontSize: "0.55rem", opacity: 0.7 }}>▼</span>
              </span>
              <div className="nav-dropdown-menu">
                <Link className="nav-dropdown-item" href="/courses/200hr">
                  {t("course200")}
                </Link>
                <Link className="nav-dropdown-item" href="/courses/100hr">
                  {t("course100")}
                </Link>
                <Link className="nav-dropdown-item" href="/courses/300hr">
                  {t("course300")}
                </Link>
                <Link className="nav-dropdown-item" href="/courses/50hr">
                  Short Courses
                </Link>
                <Link className="nav-dropdown-item" href="/retreats">
                  {t("retreats")}
                </Link>
              </div>
            </div>

            <div className="nav-dropdown-trigger">
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: isLightMode ? "rgba(28, 29, 31, 0.95)" : "rgba(255, 255, 255, 0.95)",
                  transition: "color 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                className="nav-hover-accent"
              >
                Activities<span style={{ fontSize: "0.55rem", opacity: 0.7 }}>▼</span>
              </span>
              <div className="nav-dropdown-menu">
                <Link className="nav-dropdown-item" href="/activities">
                  {t("activities")}
                </Link>
                <Link className="nav-dropdown-item" href="/accommodation">
                  Accommodation
                </Link>
                <Link className="nav-dropdown-item" href="/instructors">
                  Trainers
                </Link>
                <Link className="nav-dropdown-item" href="/gallery">
                  {t("gallery")}
                </Link>
                <Link className="nav-dropdown-item" href="/testimonials">
                  {t("testimonials")}
                </Link>
                <Link className="nav-dropdown-item" href="/blog">
                  {t("blog")}
                </Link>
                <Link className="nav-dropdown-item" href="/#faq">
                  {t("faq")}
                </Link>
              </div>
            </div>
          </div>

          <div style={{ position: "relative" }} className="language-selector-dropdown">
            <LanguageSwitcher isLightMode={isLightMode} />
          </div>

          <Link
            className="btn-primary"
            style={{
              padding: "10px 24px",
              fontSize: "0.72rem",
              whiteSpace: "nowrap",
              borderRadius: "4px",
              border: "none",
            }}
            href="/apply"
          >
            {t("applyNow")}
          </Link>
        </div>
      </nav>

      {/* DRAWER MENU OVERLAY (FULL SCREEN) */}
      <div
        className="drawer-overlay"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99,
          background: "#FAF8F5", // Warm premium cream matches reference `--color-bg`
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? "auto" : "none",
          transform: menuOpen ? "translateY(0)" : "translateY(-10px)",
          transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "120px 80px 48px 80px",
          overflowY: "auto",
        }}
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "48px", maxWidth: "1100px", width: "100%", margin: "0 auto" }}
          className="drawer-grid"
        >
          {menuColumns.map((column) => (
            <div key={column.title}>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "#FAF8F5", // will be covered by CSS styles block below using colors from globals.css
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  display: "block",
                  borderBottom: "1.5px solid rgba(44, 74, 46, 0.1)",
                  paddingBottom: "10px",
                  marginBottom: "24px",
                }}
                className="drawer-col-title"
              >
                {column.title}
              </span>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "16px", padding: 0, margin: 0 }}>
                {column.links.map((link) => {
                  const toUrl = link.href || localizedMenuHref(link.to || "/");
                  const isExternal = !!link.href;
                  return (
                    <li key={link.label}>
                      {isExternal ? (
                        <a
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: "1.25rem",
                            fontWeight: 400,
                            color: "#1C1D1F",
                            textDecoration: "none",
                            transition: "color 0.25s ease",
                          }}
                          className="drawer-link-item"
                          href={toUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontSize: "1.25rem",
                            fontWeight: 400,
                            color: "#1C1D1F",
                            textDecoration: "none",
                            transition: "color 0.25s ease",
                          }}
                          className="drawer-link-item"
                          href={toUrl}
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(44, 74, 46, 0.1)",
            paddingTop: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "1100px",
            width: "100%",
            margin: "0 auto",
          }}
          className="drawer-footer"
        >
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.72rem", color: "#6C6E75" }}>
            © 2026 Bali Yoga Teacher Training Center. All rights reserved.
          </span>
          <div style={{ display: "flex", gap: "24px" }}>
            <Link
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.72rem",
                color: "#6C6E75",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              className="drawer-footer-link"
              href="/terms"
            >
              Privacy Policy
            </Link>
            <Link
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.72rem",
                color: "#6C6E75",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              className="drawer-footer-link"
              href="/terms"
            >
              Refund Policy
            </Link>
            <Link
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.72rem",
                color: "#6C6E75",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              className="drawer-footer-link"
              href="/terms"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>

      {/* EMBEDDED CSS FOR PREMIUM ANIMATIONS AND STYLING */}
      <style>{`
        /* Circle wrap logo styling matches reference exactly */
        .brand-logo-wrap {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
        }
        .brand-logo-img {
          width: 44px !important;
          height: 44px !important;
          object-fit: cover !important;
          display: block;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
        .logo-title {
          font-family: var(--font-serif);
          font-size: 1.2rem;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: color 0.3s ease;
        }
        .logo-subtitle {
          font-family: var(--font-sans);
          font-size: 0.52rem;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          margin-top: 3px;
          transition: color 0.3s ease;
        }
        
        .nav-dropdown-trigger {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 10px 0;
        }
        .nav-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          background: rgba(249, 247, 244, 0.98);
          border: 1px solid rgba(44, 74, 46, 0.1);
          box-shadow: 0 12px 30px rgba(44, 74, 46, 0.12);
          border-radius: 8px;
          min-width: 260px;
          opacity: 0;
          visibility: hidden;
          transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 10px 0;
          z-index: 120;
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(20px);
        }
        .nav-dropdown-trigger:hover .nav-dropdown-menu {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        .nav-dropdown-item {
          padding: 10px 20px;
          font-family: var(--font-sans);
          font-size: 0.72rem;
          font-weight: 550;
          color: #1C1D1F;
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .nav-dropdown-item:hover {
          background: rgba(44, 74, 46, 0.04);
          color: hsl(var(--brand, 18 82% 55%)) !important;
          padding-left: 24px;
        }

        .drawer-col-title {
          color: hsl(var(--brand, 18 82% 55%)) !important;
        }
        .drawer-link-item:hover {
          color: hsl(var(--brand, 18 82% 55%)) !important;
        }
        .drawer-footer-link:hover {
          color: #1C1D1F !important;
        }

        .navbar-brand-logo:hover .brand-logo-img {
          transform: rotate(15deg) scale(1.05);
        }
        .brand-logo-img {
          transition: transform 0.3s ease;
        }
        .nav-hover-accent:hover {
          color: hsl(var(--brand, 18 82% 55%)) !important;
        }

        @media (max-width: 1150px) {
          .desktop-links { display: none !important; }
          .nav-bar-container { 
            display: flex !important; 
            justify-content: space-between !important; 
            padding: 0 20px !important; 
            height: 68px !important;
          }
          .menu-label-text { display: none !important; }
          .drawer-overlay { padding: 100px 40px 32px 40px !important; }
          .drawer-grid { grid-template-columns: 1fr 1fr !important; gap: 36px !important; }
          .drawer-footer { flex-direction: column !important; gap: 16px !important; align-items: flex-start !important; }
          
          .navbar-right-section { 
            gap: 10px !important; 
            display: flex !important;
            align-items: center !important;
            justify-content: flex-end !important;
          }
          .language-selector-dropdown button {
            padding: 6px 10px !important;
            gap: 4px !important;
          }
          .language-selector-dropdown button svg {
            display: none !important;
          }
          .navbar-right-section .btn-primary { 
            padding: 8px 16px !important; 
            font-size: 0.68rem !important; 
            letter-spacing: 0.02em !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }
          .brand-logo-wrap {
            width: 36px !important;
            height: 36px !important;
          }
          .brand-logo-img {
            width: 36px !important;
            height: 36px !important;
          }
          .logo-title {
            font-size: 0.95rem !important;
            letter-spacing: 0.05em !important;
          }
          .logo-subtitle {
            display: none !important;
          }
          .brand-logo-container {
            gap: 7px !important;
          }
        }
        
        @media (max-width: 767px) {
          .nav-bar-container { 
            padding: 0 12px !important; 
          }
          .drawer-overlay { padding: 90px 24px 32px 24px !important; }
          .drawer-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .navbar-right-section { 
            gap: 6px !important; 
          }
          .language-selector-dropdown button {
            padding: 6px 8px !important;
          }
          .navbar-right-section .btn-primary { 
            padding: 7px 12px !important; 
            font-size: 0.65rem !important; 
          }
        }
      `}</style>
    </>
  );
};
