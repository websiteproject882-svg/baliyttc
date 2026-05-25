"use client";

import { useHomeCopy } from "@/lib/use-home-copy";
import { Link } from "@/i18n/routing";

export const SanctuaryIntro = () => {
  const copy = useHomeCopy();

  return (
    <section
      style={{
        background: "var(--color-bg, #FAF8F5)",
        padding: "80px 0",
        borderBottom: "1px solid var(--color-border, rgba(44, 74, 46, 0.1))",
      }}
    >
      <div className="container-wide">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "40px",
            alignItems: "start",
          }}
          className="md:grid-cols-12"
        >
          {/* LEFT COLUMN: TITLE AND TAG */}
          <div
            className="md:col-span-5"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <span
              className="label-caps"
              style={{
                color: "hsl(var(--brand))",
                fontWeight: 600,
                letterSpacing: "0.2em",
                fontSize: "0.7rem",
              }}
            >
              {copy.intro.eyebrow}
            </span>
            <h3
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
                lineHeight: 1.15,
                color: "hsl(var(--ink))",
                fontWeight: 300,
                margin: 0,
              }}
            >
              Where ancient{" "}
              <em style={{ fontStyle: "italic", fontFamily: "var(--font-serif)" }}>lineage</em>{" "}
              meets modern spiritual{" "}
              <em style={{ fontStyle: "italic", fontFamily: "var(--font-serif)" }}>transformation</em>.
            </h3>
            <div
              style={{
                width: "60px",
                height: "1px",
                background: "var(--color-border, rgba(44, 74, 46, 0.1))",
                marginTop: "12px",
              }}
            ></div>
          </div>

          {/* RIGHT COLUMN: DETAILED DESCRIPTIONS AND LINK */}
          <div
            className="md:col-span-7"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.25rem",
                lineHeight: 1.6,
                color: "hsl(var(--ink))",
                fontWeight: 400,
                margin: 0,
              }}
            >
              {copy.intro.subtitle}
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.9375rem",
                lineHeight: 1.75,
                color: "hsl(var(--ink-muted))",
                margin: 0,
              }}
            >
              {copy.intro.body}
            </p>
            <div style={{ marginTop: "8px" }}>
              <Link
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "hsl(var(--brand))",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "gap 0.2s ease",
                }}
                className="hover-arrow"
                href="/about"
              >
                <span>{copy.intro.cta}</span>
                <span className="arrow-sym" style={{ fontSize: "1.1rem", transition: "transform 0.2s ease" }}>
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .md\\:grid-cols-12 {
            grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
          }
          .md\\:col-span-5 {
            grid-column: span 5 / span 5 !important;
          }
          .md\\:col-span-7 {
            grid-column: span 7 / span 7 !important;
          }
        }
        .hover-arrow:hover .arrow-sym {
          transform: translateX(4px);
        }
      `}</style>
    </section>
  );
};
