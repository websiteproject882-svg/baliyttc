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
    <section className="relative overflow-hidden border-y border-stone-200/50 bg-[#FAF9F6] p-0">
      {/* DESKTOP VIEW: divided flex bar */}
      <div className="container-wide hidden md:flex items-center justify-between h-20 px-8 mx-auto w-full">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`flex flex-col items-center justify-center flex-1 px-4 gap-1.5 h-full ${
              index === stats.length - 1 ? "" : "border-r border-stone-200/60"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-lg md:text-xl font-medium text-brand leading-none">
                {stat.value}
              </span>
            </div>
            <span className="label-caps text-[9px] tracking-[0.16em] text-gray-500">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* MOBILE/TABLET VIEW: infinite marquee scroll */}
      <div className="flex md:hidden items-center overflow-hidden h-[68px] relative">
        <div
          className="flex whitespace-nowrap scroll-smooth"
          style={{
            animation: "marquee-stats 22s linear infinite",
          }}
        >
          {marqueeStats.map((stat, index) => (
            <div
              key={index}
              className="inline-flex flex-col items-center justify-center min-width-[140px] px-6 gap-1 h-[68px] border-r border-stone-200/60"
            >
              <span className="font-serif text-[1.1rem] font-medium text-brand leading-none">
                {stat.value}
              </span>
              <span className="label-caps text-[8px] tracking-[0.12em] text-gray-500">
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

