"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { faqs } from "@/data/marketing-pages";

export type PublicFAQItem = {
  category: string;
  q: string;
  a: string;
};

export function FAQPageClient({ initialFaqs = faqs }: { initialFaqs?: PublicFAQItem[] }) {
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(initialFaqs.map((item) => item.category)))],
    [initialFaqs],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return initialFaqs.filter((item) => {
      const matchesCategory = active === "All" || item.category === active;
      const matchesQuery = !normalized || `${item.q} ${item.a}`.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [active, initialFaqs, query]);

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActive(category)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                active === category ? "bg-terra text-white" : "bg-white text-warm-mid hover:bg-sand"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <label className="relative block md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search questions..."
            className="w-full rounded-full border border-sand bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-terra"
          />
        </label>
      </div>

      <div className="mt-8 space-y-3">
        {filtered.map((item) => (
          <details key={item.q} className="group rounded-lg border border-sand bg-white p-5">
            <summary className="cursor-pointer list-none font-semibold text-warm-dark">
              <span className="mr-3 text-terra">+</span>{item.q}
            </summary>
            <p className="mt-4 border-t border-sand pt-4 text-sm leading-7 text-ink-soft">{item.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}
