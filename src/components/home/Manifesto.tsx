"use client";

import { IMG } from "@/data/site";
import { useRef } from "react";
import { useHomeCopy } from "@/lib/use-home-copy";
import { Link } from "@/i18n/routing";

const whyImages = [IMG.graduation, IMG.classMain, IMG.certified, IMG.course100, IMG.templePurification, IMG.pranayama];

export const Manifesto = () => {
  const copy = useHomeCopy();
  const whyCards = copy.manifesto.cards.map((card, index) => ({
    ...card,
    image: whyImages[index] || IMG.classMain,
  }));
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollSlider = (direction: "prev" | "next") => {
    const node = sliderRef.current;
    if (!node) return;

    node.scrollBy({
      left: direction === "next" ? 382 : -382, // matches card width + gap
      behavior: "smooth",
    });
  };

  return (
    <section
      className="section"
      id="why-us"
      style={{
        background: "var(--color-surface, #F3EDE6)",
        borderTop: "1px solid var(--color-border, rgba(44, 74, 46, 0.1))",
        borderBottom: "1px solid var(--color-border, rgba(44, 74, 46, 0.1))",
        padding: "100px 0",
      }}
    >
      <div className="container-wide">
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }} className="section-header centered">
          <p className="label-caps" style={{ color: "hsl(var(--ink-muted))" }}>
            {copy.manifesto.eyebrow}
          </p>
          <div
            className="divider"
            style={{
              width: "60px",
              height: "1px",
              background: "rgba(44, 74, 46, 0.15)",
              margin: "16px auto 24px",
            }}
          ></div>
          <h2 className="display-lg" style={{ color: "hsl(var(--ink))", marginBottom: "16px" }}>
            {copy.manifesto.title} <em style={{ fontStyle: "italic", fontFamily: "var(--font-serif)" }}>{copy.manifesto.accent}</em>
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "1rem",
              color: "hsl(var(--ink-muted))",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            {copy.manifesto.description}
          </p>
        </div>

        {/* Card Slider */}
        <div style={{ position: "relative" }}>
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => scrollSlider("prev")}
            style={{
              position: "absolute",
              left: "-22px",
              top: "230px",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "1px solid rgba(44, 74, 46, 0.1)",
              background: "#FAF8F5",
              color: "#1C1D1F",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              transition: "all 0.25s ease",
              boxShadow: "0 4px 12px rgba(20,26,21,0.08)",
            }}
            className="slider-side-arrow left-arrow"
            aria-label="Scroll left"
          >
            ⟨
          </button>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollSlider("next")}
            style={{
              position: "absolute",
              right: "-22px",
              top: "230px",
              transform: "translateY(-50%)",
              zIndex: 10,
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "1px solid rgba(44, 74, 46, 0.1)",
              background: "#FAF8F5",
              color: "#1C1D1F",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              transition: "all 0.25s ease",
              boxShadow: "0 4px 12px rgba(20,26,21,0.08)",
            }}
            className="slider-side-arrow right-arrow"
            aria-label="Scroll right"
          >
            ⟩
          </button>

          {/* Slider list */}
          <div
            ref={sliderRef}
            id="why-us-slider"
            className="scroll-slider"
            style={{
              display: "flex",
              gap: "32px",
              overflowX: "auto",
              paddingBottom: "32px",
              scrollBehavior: "smooth",
            }}
          >
            {whyCards.map((card) => (
              <div
                key={card.title}
                style={{
                  width: "350px",
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  background: "transparent",
                  border: "none",
                  boxShadow: "none",
                  transition: "transform 0.3s ease",
                }}
                className="why-card"
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "460px",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                  className="why-img-container"
                >
                  <img
                    alt={card.title}
                    src={card.image}
                    style={{
                      position: "absolute",
                      height: "100%",
                      width: "100%",
                      left: 0,
                      top: 0,
                      right: 0,
                      bottom: 0,
                      objectFit: "cover",
                      color: "transparent",
                      transition: "transform 0.5s ease",
                    }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div style={{ padding: "16px 4px 8px 4px" }}>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "hsl(var(--brand))",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      margin: "0 0 6px 0",
                    }}
                  >
                    {card.eyebrow}
                  </p>
                  <h4
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontSize: "1.35rem",
                      color: "hsl(var(--ink))",
                      margin: "0 0 8px 0",
                      fontWeight: 400,
                      lineHeight: 1.25,
                    }}
                  >
                    {card.title}
                  </h4>
                  <p
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "0.8125rem",
                      color: "hsl(var(--ink-muted))",
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Link */}
        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <Link
            className="btn-outline"
            style={{
              display: "inline-block",
              border: "2px solid hsl(var(--brand))",
              color: "hsl(var(--brand))",
              background: "transparent",
              borderRadius: "4px",
              padding: "10px 24px",
              fontSize: "0.8125rem",
              textTransform: "uppercase",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textDecoration: "none",
            }}
            href="/about"
          >
            Explore Our Story →
          </Link>
        </div>
      </div>

      <style>{`
        .why-card:hover {
          transform: translateY(-3px);
        }
        .why-card:hover img {
          transform: scale(1.04);
        }
        .slider-side-arrow:hover {
          background: hsl(var(--brand)) !important;
          color: #fff !important;
          border-color: hsl(var(--brand)) !important;
          transform: translateY(-50%) scale(1.05) !important;
        }
        
        .scroll-slider {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scroll-slider::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }

        @media (max-width: 767px) {
          .slider-side-arrow {
            width: 36px !important;
            height: 36px !important;
            font-size: 0.95rem !important;
          }
          .left-arrow {
            left: 8px !important;
          }
          .right-arrow {
            right: 8px !important;
          }
        }
      `}</style>
    </section>
  );
};
