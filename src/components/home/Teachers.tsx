"use client";

import { TEACHERS } from "@/data/site";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight, ArrowUpRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useHomeCopy } from "@/lib/use-home-copy";
import { useEffect, useRef, useState } from "react";

type TeacherItem = (typeof TEACHERS)[number] & {
  id?: string;
  slug?: string;
  credentials?: string;
  image?: string;
  styles?: string[];
  experience?: string;
};

type PublicTeacher = {
  id: string;
  name: string;
  slug: string;
  role: string;
  credentials: string;
  bio: string;
  image: string;
  styles: string[];
};

const updateActiveTeacher = (
  node: HTMLDivElement | null,
  setActiveIndex: (index: number) => void,
) => {
  if (!node) return;
  const cards = Array.from(node.children) as HTMLElement[];
  if (!cards.length) return;

  const viewportCenter = node.getBoundingClientRect().left + node.clientWidth / 2;
  const nearest = cards.reduce(
    (closest, card, index) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - viewportCenter);
      return distance < closest.distance ? { index, distance } : closest;
    },
    { index: 0, distance: Number.POSITIVE_INFINITY },
  );

  setActiveIndex(nearest.index);
};

const TeacherCard = ({
  teacher,
  index,
  active,
  offset,
}: {
  teacher: TeacherItem;
  index: number;
  active: boolean;
  offset: number;
}) => {
  const depth = Math.max(-2, Math.min(2, offset));
  const imagePosition =
    teacher.name === "Vivek Kalura"
      ? "center 38%"
      : teacher.name === "Sachin Rautela"
        ? "center 34%"
        : teacher.name === "Sandeep Ji"
          ? "center 28%"
          : "center 35%";

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      animate={{
        rotateY: depth * -9,
        rotateZ: depth * -0.9,
        scale: active ? 1 : 0.94,
        y: active ? 0 : 16,
        opacity: 1,
      }}
      transition={{ type: "spring", stiffness: 120, damping: 24, delay: index * 0.03 }}
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: offset < 0 ? "right center" : offset > 0 ? "left center" : "center",
      }}
      className="group min-w-[78vw] snap-center cursor-pointer will-change-transform sm:min-w-[330px] lg:min-w-[350px]"
    >
      <div className={`relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-premium-lg transition-all duration-500 ${active ? "shadow-[0_28px_70px_rgba(42,58,44,0.16)] ring-1 ring-sage/15" : "shadow-premium-md"}`}>
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={teacher.img}
            alt={teacher.name}
            className="h-full w-full object-cover brightness-[0.98] contrast-[1.02] saturate-[1.03] transition duration-700 group-hover:scale-105"
            style={{ objectPosition: imagePosition }}
            loading="lazy"
            decoding="async"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/10" />
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />

          <div className="absolute right-4 top-4 rounded-full border border-white/70 bg-white/95 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-sage shadow-premium-sm backdrop-blur">
            {teacher.cred}
          </div>

          <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/70 bg-white/[0.92] p-4 shadow-[0_18px_44px_rgba(42,58,44,0.16)] backdrop-blur-md">
            <p className="label-caps mb-2 text-sage">
              {teacher.role}
            </p>
            <h3 className="display-md text-charcoal">
              {teacher.name}
            </h3>
            <p className="mt-3 line-clamp-2 text-sm font-medium leading-relaxed text-ink-muted">
              {teacher.bio}
            </p>
          </div>
        </div>

        <div className="bg-white p-5">
          <div className="flex flex-wrap gap-2">
            {teacher.style.slice(0, 3).map((style) => (
              <span
                key={style}
                className="rounded-full border border-sage/20 bg-sage-mist/60 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-sage"
              >
                {style}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
            <Star className="h-4 w-4 fill-gold text-gold" />
            <span className="text-xs font-medium text-ink-muted">{teacher.experience}</span>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export const Teachers = () => {
  const copy = useHomeCopy();
  const fallbackTeachers = TEACHERS.map((teacher, index) => ({ ...teacher, ...copy.teachers.items[index] }));
  const [teachers, setTeachers] = useState<TeacherItem[]>(fallbackTeachers);
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadTeachers = async () => {
      try {
        const response = await fetch("/api/teachers", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { teachers?: PublicTeacher[] };
        if (!Array.isArray(data.teachers) || data.teachers.length === 0 || cancelled) return;

        setTeachers(
          data.teachers.map((teacher, index) => ({
            name: teacher.name,
            cred: teacher.credentials,
            role: teacher.role,
            img: teacher.image,
            bio: teacher.bio,
            style: teacher.styles,
            experience: copy.teachers.items[index]?.experience || "Senior teaching faculty",
            id: teacher.id,
            slug: teacher.slug,
          })),
        );
      } catch (error) {
        console.error("Failed to load public teachers", error);
      }
    };

    void loadTeachers();

    return () => {
      cancelled = true;
    };
  }, [copy.teachers.items]);

  useEffect(() => {
    const refresh = () => updateActiveTeacher(sliderRef.current, setActiveIndex);
    refresh();
    window.addEventListener("resize", refresh);
    return () => window.removeEventListener("resize", refresh);
  }, [teachers.length]);

  const scrollSlider = (direction: "prev" | "next") => {
    const node = sliderRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction === "next" ? node.clientWidth * 0.72 : -node.clientWidth * 0.72,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream via-white to-white py-12 md:py-16">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gray-100" />

      <div className="container-edit relative z-10">
        {/* Section Header */}
        <div className="mb-10 grid items-end gap-8 md:mb-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <SectionHeading
              eyebrow={copy.teachers.eyebrow}
              title={
                <>
                  {copy.teachers.title}
                  <br />
                  <span className="text-sage">{copy.teachers.accent}</span>
                </>
              }
              sub={copy.teachers.subtitle}
            />
          </div>
          <div className="flex items-center gap-3 lg:col-span-4 lg:justify-end">
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={() => scrollSlider("prev")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-charcoal shadow-premium-sm transition hover:border-sage hover:text-sage"
                aria-label="Previous teachers"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollSlider("next")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-charcoal shadow-premium-sm transition hover:border-sage hover:text-sage"
                aria-label="Next teachers"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <Link
              href="/instructors"
              className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 bg-white px-6 py-3 font-medium text-charcoal shadow-premium-sm transition-all duration-300 hover:border-sage hover:text-sage"
            >
              {copy.teachers.viewAll} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Teachers 3D Row */}
        <div
          ref={sliderRef}
          onScroll={() => updateActiveTeacher(sliderRef.current, setActiveIndex)}
          className="-mx-4 flex snap-x snap-proximity gap-7 overflow-x-auto overscroll-y-auto px-4 pb-8 pt-3 [perspective:1500px] [scrollbar-width:none] [touch-action:pan-x_pan-y] sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-[max(2.5rem,calc((100vw-1180px)/2))] [&::-webkit-scrollbar]:hidden"
        >
          {teachers.map((teacher, index) => (
            <TeacherCard
              key={teacher.name}
              teacher={teacher}
              index={index}
              active={index === activeIndex}
              offset={index - activeIndex}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="mb-6 text-base text-ink-muted md:text-lg">{copy.teachers.cta}</p>
        </div>
      </div>
    </section>
  );
};
