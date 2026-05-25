"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight, Check, Clock, MapPin, Search, Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { IMG } from "@/data/site";
import { getPageCopy } from "@/lib/page-i18n";

const activityCategories = ["All", "Ceremony", "Workshop", "Nature", "Wellness", "Creative"];

const toActivitySlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const activities = [
  {
    title: "Holy Temple Purification",
    category: "Ceremony",
    duration: "Half day",
    location: "Balinese water temple",
    image: IMG.balinesesTempleGateway,
    excerpt: "A sacred Balinese cleansing ceremony where students set intention and experience local spiritual tradition.",
    details:
      "Students visit a traditional water temple for a guided purification ritual. The experience is designed as a respectful introduction to Balinese Hindu culture, not as a tourist performance. Teachers explain basic etiquette, dress code, intention setting, and how the ceremony connects to inner discipline during yoga training.",
    includes: ["Temple etiquette briefing", "Traditional sarong guidance", "Water cleansing ritual", "Reflection and integration circle"],
    goodFor: "Students who want to understand Bali as a living spiritual culture while keeping the experience respectful.",
  },
  {
    title: "Balinese Welcome Ceremony",
    category: "Ceremony",
    duration: "60-90 min",
    location: "Campus",
    image:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:864/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Balinese-Welcome-Ceremony-for-YTT.jpg",
    excerpt: "A grounding opening ritual that helps students arrive, connect and begin training with shared intention.",
    details:
      "The welcome ceremony introduces the group to the rhythm of the school and the cultural setting of Ubud. It creates a calm beginning before the training schedule becomes more intense. Students meet teachers, receive orientation and start the course with a collective intention.",
    includes: ["Opening intention", "Teacher introduction", "Campus orientation", "Student connection circle"],
    goodFor: "All new batches, especially students arriving from long travel or first-time Bali visitors.",
  },
  {
    title: "Gabogan Making",
    category: "Creative",
    duration: "2-3 hours",
    location: "Campus workshop",
    image: IMG.ceremonyAlt,
    excerpt: "Learn how Balinese offering towers are prepared and why offerings are part of daily life in Bali.",
    details:
      "Gabogan making gives students a hands-on introduction to Balinese devotional craft. The workshop explains the symbolism of fruit, flowers and balance while students create a simple offering form with guidance. The focus is patience, presence and respect for local culture.",
    includes: ["Cultural context", "Offering materials", "Hands-on practice", "Photo moment and closing reflection"],
    goodFor: "Students interested in ceremony, craft, mindfulness and Balinese daily culture.",
  },
  {
    title: "Mandala Painting",
    category: "Creative",
    duration: "2-3 hours",
    location: "Campus studio",
    image: IMG.mandala,
    excerpt: "A meditative art session that uses pattern, colour and silence to reset attention after training.",
    details:
      "Mandala painting is used as a quiet integration practice. Students slow down, work with symmetry and learn how creative repetition can become meditation. It is not about artistic skill. It is about focus, patience and observing the mind.",
    includes: ["Mandala concept introduction", "Materials and templates", "Guided silent painting", "Group reflection"],
    goodFor: "All levels. No art experience needed.",
  },
  {
    title: "Sound Healing",
    category: "Wellness",
    duration: "60-75 min",
    location: "Yoga shala",
    image: IMG.soundHealing,
    excerpt: "A restorative sound journey with bowls and vibration to help the body absorb intensive training.",
    details:
      "Sound healing is scheduled as a nervous-system reset during the course. Students rest while sound and vibration support relaxation, breath awareness and emotional integration. The session is intentionally simple so the body can recover from physical practice.",
    includes: ["Guided rest", "Sound bowl session", "Breath awareness", "Quiet integration time"],
    goodFor: "Students who need recovery, calm and deeper rest during an intense training week.",
  },
  {
    title: "Acro Yoga Workshop",
    category: "Workshop",
    duration: "2 hours",
    location: "Yoga shala",
    image:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:864/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Acro-Yoga-Workshop-at-200-hour-YTT-BALI.jpg",
    excerpt: "Partner practice for trust, communication, balance and playful confidence.",
    details:
      "The acro yoga workshop is beginner-friendly and built around communication rather than performance. Students learn safe base, flyer and spotter roles, then practise simple transitions with teacher supervision. It supports trust, play and body awareness.",
    includes: ["Partner safety briefing", "Base/flyer/spotter roles", "Beginner transitions", "Communication drills"],
    goodFor: "Students comfortable with partner work and willing to practise with patience and consent.",
  },
  {
    title: "Arm Balancing Workshop",
    category: "Workshop",
    duration: "2 hours",
    location: "Yoga shala",
    image: IMG.armBalance,
    excerpt: "Technique-based training for strength, alignment and confidence in arm balance foundations.",
    details:
      "This workshop breaks arm balances into preparation, mobility, core strength, hand placement, shoulder stability and mental focus. Students learn how to progress safely instead of forcing poses. Teachers offer modifications for different levels.",
    includes: ["Wrist and shoulder prep", "Core activation", "Step-by-step drills", "Progressions and modifications"],
    goodFor: "Students with regular practice who want to understand arm balance mechanics safely.",
  },
  {
    title: "Ice Bath & Breathwork",
    category: "Wellness",
    duration: "90 min",
    location: "Campus",
    image: IMG.pranayama,
    excerpt: "A resilience session combining breath, nervous-system awareness and controlled cold exposure.",
    details:
      "The ice bath is guided with safety first. Students learn simple breath regulation before cold exposure and are never pushed beyond their limits. The goal is not toughness; it is self-regulation, calm response and learning how the mind reacts under intensity.",
    includes: ["Breath preparation", "Safety briefing", "Optional cold exposure", "Warm recovery and reflection"],
    goodFor: "Students without contraindications who want a practical nervous-system challenge.",
  },
  {
    title: "Beach Yoga",
    category: "Nature",
    duration: "Half day",
    location: "Bali beach",
    image: IMG.beachYoga,
    excerpt: "Outdoor practice by the ocean with movement, breath and connection to Bali's natural rhythm.",
    details:
      "Beach yoga gives students a different practice environment outside the shala. The session usually stays grounding and accessible, focused on breath, nature, rhythm and the experience of practising in open space.",
    includes: ["Outdoor asana practice", "Breathwork", "Group photos", "Quiet beach time"],
    goodFor: "Students who want to experience yoga beyond the studio setting.",
  },
  {
    title: "Waterfall Excursion",
    category: "Nature",
    duration: "Half day",
    location: "Ubud area",
    image: IMG.yttBali,
    excerpt: "A restorative nature trip that gives students space to pause between intensive training days.",
    details:
      "The waterfall excursion is designed as a reset from the training schedule. Students spend time in nature, take photos, rest and return with more energy for the next block of classes. The day remains simple so it does not become exhausting.",
    includes: ["Group transfer", "Nature visit", "Free time", "Teacher/staff support"],
    goodFor: "Students needing a visual and energetic break from classroom intensity.",
  },
  {
    title: "Coffee Plantation Visit",
    category: "Nature",
    duration: "Half day",
    location: "Local plantation",
    image: IMG.classMain,
    excerpt: "A local culture stop to learn about Balinese crops, coffee, spices and rural daily life.",
    details:
      "This visit introduces students to Bali's local agriculture and community life. It is often paired with a nature excursion and gives students a softer cultural experience beyond the yoga campus.",
    includes: ["Plantation walk", "Coffee and spice introduction", "Local tasting", "Short cultural explanation"],
    goodFor: "Students interested in Bali outside the shala, food culture and simple local learning.",
  },
];

const schedule = [
  { stage: "Before", title: "Orientation", text: "Teachers explain dress code, safety, cultural etiquette and the purpose of each activity." },
  { stage: "During", title: "Guided Experience", text: "Students move with the group and receive support from teachers or staff throughout the session." },
  { stage: "After", title: "Integration", text: "The group returns to practice, journaling, discussion or rest so the activity supports the training." },
];

const faqs = [
  {
    q: "Are all activities included in every course?",
    a: "Core cultural experiences and workshops are included in the main YTT programs, while the exact schedule can vary by course duration, season, weather and local ceremony dates.",
  },
  {
    q: "Do I need previous experience for workshops?",
    a: "Most workshops are beginner-friendly. Arm balancing needs some regular yoga practice, and ice bath participation is always optional and safety-led.",
  },
  {
    q: "Are temple ceremonies respectful for international students?",
    a: "Yes. Students receive etiquette guidance, appropriate dress instructions and context before joining any Balinese cultural or temple experience.",
  },
  {
    q: "Can admin change or add activities later?",
    a: "Yes. Public content is structured so activities can later be moved into admin-managed content without changing the page design.",
  },
];

const Activities = () => {
  const locale = useLocale();
  const copy = getPageCopy(locale, "activities");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeActivity, setActiveActivity] = useState("activity-0");

  useEffect(() => {
    const openActivityFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;

      const index = activities.findIndex((activity) => toActivitySlug(activity.title) === hash);
      if (index === -1) return;

      setActiveCategory("All");
      setSearchQuery("");
      setActiveActivity(`activity-${index}`);

      window.setTimeout(() => {
        document.getElementById(`${hash}-details`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    };

    openActivityFromHash();
    window.addEventListener("hashchange", openActivityFromHash);
    return () => window.removeEventListener("hashchange", openActivityFromHash);
  }, []);

  const filteredActivities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return activities.filter((activity) => {
      const matchesCategory = activeCategory === "All" || activity.category === activeCategory;
      const matchesSearch =
        !query ||
        activity.title.toLowerCase().includes(query) ||
        activity.excerpt.toLowerCase().includes(query) ||
        activity.details.toLowerCase().includes(query) ||
        activity.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 pt-32">
      <div className="container-wide">
        <Reveal>
          <Link href="/" className="label-caps mb-8 inline-block text-gray-500 transition-colors hover:text-[#F04E23]">
            {copy.backHome}
          </Link>
        </Reveal>

        <Reveal delay={0.1}>
          <SectionHeading
            eyebrow={copy.eyebrow}
            title={<>{copy.title} <em className="text-[#F04E23]">{copy.accent}</em></>}
            sub={copy.subtitle}
          />
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-10 rounded-[10px] border border-stone-200 bg-white p-5 shadow-[0_16px_40px_rgba(42,36,28,0.06)]">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={copy.search}
                  className="h-12 w-full border border-stone-300 bg-white pl-11 pr-4 text-sm outline-none transition-colors focus:border-[#F04E23]"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {activityCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                      activeCategory === category
                        ? "border-[#F04E23] bg-[#F04E23] text-white"
                        : "border-stone-200 bg-white text-gray-600 hover:border-[#F04E23] hover:text-[#F04E23]"
                    }`}
                  >
                    {copy.categories[category as keyof typeof copy.categories] || category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <section className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {filteredActivities.map((activity, index) => (
            <Reveal key={activity.title} delay={index * 0.05}>
              <motion.article
                id={toActivitySlug(activity.title)}
                role="button"
                tabIndex={0}
                onClick={() => {
                  const slug = toActivitySlug(activity.title);
                  setActiveActivity(`activity-${activities.findIndex((item) => item.title === activity.title)}`);
                  window.history.replaceState(null, "", `#${slug}`);
                  document.getElementById(`${slug}-details`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  const slug = toActivitySlug(activity.title);
                  setActiveActivity(`activity-${activities.findIndex((item) => item.title === activity.title)}`);
                  window.history.replaceState(null, "", `#${slug}`);
                  document.getElementById(`${slug}-details`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                whileHover={{ y: -5 }}
                className="group h-full cursor-pointer overflow-hidden rounded-[10px] bg-white shadow-[0_16px_40px_rgba(42,36,28,0.08)] ring-1 ring-stone-200 transition-all duration-300 hover:shadow-[0_24px_60px_rgba(42,36,28,0.12)] focus:outline-none focus:ring-2 focus:ring-[#F04E23]"
              >
                <div className="overflow-hidden bg-stone-100">
                  <img
                    src={activity.image}
                    alt={copy.titles[activity.title as keyof typeof copy.titles] || activity.title}
                    className="aspect-[4/3] h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    onError={(event) => {
                      event.currentTarget.src = IMG.classMain;
                    }}
                  />
                </div>
                <div className="p-6">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge className="bg-[#F04E23]/10 text-[#F04E23] hover:bg-[#F04E23]/10">{activity.category}</Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      {activity.duration}
                    </span>
                  </div>
                  <h2 className="display-sm text-gray-950">{copy.titles[activity.title as keyof typeof copy.titles] || activity.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-gray-600">{activity.excerpt}</p>
                  <div className="mt-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-gray-500">
                    <MapPin className="h-3.5 w-3.5 text-[#F04E23]" />
                    {activity.location}
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[#F04E23]">
                    {copy.readDetails}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </motion.article>
            </Reveal>
          ))}
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <Reveal>
            <div className="rounded-[10px] bg-warm-dark p-8 text-white md:p-10">
              <p className="label-caps mb-5 text-orange-300">{copy.learnMore}</p>
              <h2 className="display-md">{copy.notesTitle}</h2>
              <p className="mt-4 leading-8 text-white/75">
                {copy.notesText}
              </p>
              <div className="mt-8 space-y-5">
                {schedule.map((item) => (
                  <div key={item.stage} className="border-t border-white/10 pt-5">
                    <p className="label-caps text-orange-300">{item.stage}</p>
                    <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-7 text-white/70">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <Accordion type="single" collapsible value={activeActivity} onValueChange={setActiveActivity} className="space-y-3">
              {activities.map((activity, index) => (
                <AccordionItem
                  key={activity.title}
                  id={`${toActivitySlug(activity.title)}-details`}
                  value={`activity-${index}`}
                  className="rounded-[10px] border border-stone-200 bg-white px-0 shadow-sm scroll-mt-32"
                >
                  <AccordionTrigger className="px-5 py-5 text-left hover:no-underline md:px-6">
                    <div className="flex items-center gap-4">
                      <span className="number-value text-sm text-stone-400">{String(index + 1).padStart(2, "0")}</span>
                      <span className="text-[1.05rem] font-semibold text-gray-950 md:text-[1.18rem]">{copy.titles[activity.title as keyof typeof copy.titles] || activity.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-6 md:px-6">
                    <div className="border-t border-stone-100 pt-5">
                      <p className="leading-8 text-gray-600">{activity.details}</p>
                      <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <div>
                          <h4 className="label-caps mb-3 text-[#F04E23]">{copy.included}</h4>
                          <ul className="space-y-2.5">
                            {activity.includes.map((item) => (
                              <li key={item} className="flex gap-3 text-sm leading-6 text-gray-600">
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="label-caps mb-3 text-[#F04E23]">{copy.bestFor}</h4>
                          <p className="text-sm leading-7 text-gray-600">{activity.goodFor}</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </section>

        <section className="mt-16 rounded-[10px] bg-white p-6 shadow-[0_16px_40px_rgba(42,36,28,0.06)] ring-1 ring-stone-200 md:p-8">
          <Reveal>
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <p className="label-caps text-[#F04E23]">{copy.faqEyebrow}</p>
                <h2 className="display-md mt-3 text-gray-950">{copy.faqTitle}</h2>
                <p className="mt-4 leading-8 text-gray-600">
                  {copy.faqText}
                </p>
              </div>
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <AccordionItem key={faq.q} value={`faq-${index}`} className="rounded-[8px] border border-stone-200 px-4">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">{faq.q}</AccordionTrigger>
                    <AccordionContent className="text-sm leading-7 text-gray-600">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </Reveal>
        </section>

        <Reveal>
          <div className="mt-16 overflow-hidden rounded-[10px] bg-gradient-to-r from-[#F04E23] to-[#D9471F] p-8 text-white md:p-10">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em]">
                  <Sparkles className="h-4 w-4" />
                  {copy.ctaEyebrow}
                </div>
                <h2 className="display-md">{copy.ctaTitle}</h2>
                <p className="mt-3 max-w-2xl leading-8 text-white/80">
                  {copy.ctaText}
                </p>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#F04E23] transition-colors hover:bg-orange-50"
              >
                {copy.ctaButton}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default Activities;
