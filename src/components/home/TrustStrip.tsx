"use client";

import { useHomeCopy } from "@/lib/use-home-copy";

export const TrustStrip = () => {
  const copy = useHomeCopy();

  const stats = [
    { value: "Yoga Alliance", label: "RYS 200 & 300" },
    { value: "2,500+", label: "Graduates" },
    { value: "4.9 / 5", label: "Average Rating" },
    { value: "Since 2016", label: "10 Years Teaching" },
    { value: "70+", label: "Nationalities" },
    { value: "98%", label: "Would Recommend" },
  ];

  // Duplicate for seamless infinite marquee on mobile
  const marqueeStats = [...stats, ...stats];

  return (
    <section
      style={{
        borderBottom: "1px solid var(--color-border, rgba(44, 74, 46, 0.1))",
        borderTop: "1px solid var(--color-border, rgba(44, 74, 46, 0.1))",
        background: "var(--color-surface, #F3EDE6)",
        padding: 0,
        overflow: "hidden",
      }}
    >
      {/* DESKTOP VIEW: divided flex bar */}
      <div
        className="container hidden md:flex"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          height: "72px",
          margin: "0 auto",
          width: "100%",
          maxWidth: "1280px",
          padding: "0 40px",
        }}
      >
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              borderRight: index === stats.length - 1 ? "none" : "1px solid var(--color-border, rgba(44, 74, 46, 0.1))",
              flex: 1,
              padding: "0 16px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "1.125rem",
                fontWeight: 500,
                color: "hsl(var(--brand))",
                lineHeight: 1,
              }}
            >
              {stat.value}
            </span>
            <span className="label-caps" style={{ fontSize: "0.65rem", letterSpacing: "0.08em" }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* MOBILE/TABLET VIEW: infinite marquee scroll */}
      <div
        className="flex md:hidden"
        style={{
          overflow: "hidden",
          height: "60px",
          position: "relative",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 0,
            animation: "marquee-stats 20s linear infinite",
            whiteSpace: "nowrap",
          }}
        >
          {marqueeStats.map((stat, index) => (
            <div
              key={index}
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                minWidth: "140px",
                padding: "0 16px",
                borderRight: "1px solid var(--color-border, rgba(44, 74, 46, 0.1))",
                height: "60px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: "hsl(var(--brand))",
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </span>
              <span className="label-caps" style={{ fontSize: "0.6rem", letterSpacing: "0.08em" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes marquee-stats {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
};
