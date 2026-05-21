"use client";
import { ReactNode } from "react";
import { Reveal } from "./Reveal";

interface Props {
  eyebrow?: string;
  title: ReactNode;
  sub?: ReactNode;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
}

export const SectionHeading = ({ eyebrow, title, sub, align = "left", light, className = "" }: Props) => (
  <div
    className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""} ${className}`}
  >
    {eyebrow && (
      <Reveal>
        <p className={`label-caps mb-5 inline-flex items-center gap-3 ${light ? "text-sage-light" : "text-sage"}`}>
          {eyebrow}
        </p>
      </Reveal>
    )}
    <Reveal delay={0.05}>
      <h2 className={`display-lg ${light ? "text-cream" : "text-charcoal"}`}>
        {title}
      </h2>
    </Reveal>
    {sub && (
      <Reveal delay={0.1}>
        <p className={`body-lg mt-5 ${light ? "text-cream/70" : "text-ink-soft"}`}>
          {sub}
        </p>
      </Reveal>
    )}
  </div>
);
