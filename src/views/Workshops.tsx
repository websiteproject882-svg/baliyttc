"use client";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ApplyModal } from "@/components/shared/ApplyModal";
import { Button } from "@/components/ui/button";
import { IMG, SITE } from "@/data/site";
import { Check, Calendar, Clock, Users, Sparkles, Volume2, Accessibility, Palette, Star, ArrowRight } from "lucide-react";

const workshops = [
  {
    slug: "sound-healing",
    title: "Sound Healing Workshop",
    subtitle: "Tibetan Bowls & Sacred Sound",
    description: "Immerse yourself in the healing frequencies of Tibetan singing bowls, crystal bowls, and sacred instruments. This deeply restorative workshop uses sound vibrations to release tension, quiet the mind, and activate your body's natural healing response.",
    longDesc: "Led by Mrs. Yuli, our resident sound healing specialist and native Balinese practitioner, this workshop combines ancient Balinese healing traditions with Himalayan sound therapy. You'll experience gongs, crystal singing bowls, tongue drums, and hand pans in a deeply meditative setting.",
    image: IMG.soundHealing,
    icon: Volume2,
    price: 89,
    duration: "3 Hours",
    level: "All Levels",
    upcoming: [
      { date: "Feb 20, 2026", time: "4:00 PM - 7:00 PM", spots: 12, total: 16 },
      { date: "Mar 5, 2026", time: "4:00 PM - 7:00 PM", spots: 8, total: 16 },
      { date: "Mar 22, 2026", time: "4:00 PM - 7:00 PM", spots: 14, total: 16 },
    ],
    benefits: [
      "Deep stress relief and nervous system reset",
      "Improved sleep quality",
      "Release of held emotions and tension",
      "Enhanced meditation practice",
      "Chakra balancing through sound frequencies",
    ],
    includes: ["Welcome herbal tea", "Comfortable meditation cushions", "Sound bath experience", "Take-home meditation guide", "Certificate of participation"],
    teacher: "Mrs. Yuli",
    teacherImg: IMG.yuli,
    featured: true,
    color: "from-purple-500 to-violet-600",
  },
  {
    slug: "acro-yoga",
    title: "Acro Yoga Workshop",
    subtitle: "Trust, Play & Flying Yoga",
    description: "Discover the joy of flying! Acro Yoga combines acrobatics, healing arts, and yoga into one playful practice. Learn to base, fly, and spot safely while building trust and connection with your partner.",
    longDesc: "Perfect for beginners and those who want to explore the lighter side of yoga. Our certified Acro Yoga instructors will guide you through warm-up games, shoulder mobility, foundational poses, and your first flying experience. No partner needed — we'll pair you with compatible flyers!",
    image: IMG.acroYoga,
    icon: Accessibility,
    price: 99,
    duration: "4 Hours",
    level: "Beginner Friendly",
    upcoming: [
      { date: "Feb 22, 2026", time: "9:00 AM - 1:00 PM", spots: 10, total: 14 },
      { date: "Mar 8, 2026", time: "9:00 AM - 1:00 PM", spots: 6, total: 14 },
      { date: "Mar 25, 2026", time: "9:00 AM - 1:00 PM", spots: 12, total: 14 },
    ],
    benefits: [
      "Build trust and communication skills",
      "Increase body awareness and spatial coordination",
      "Strengthen core, shoulders, and back",
      "Experience pure joy and playfulness",
      "Meet like-minded people in a fun environment",
    ],
    includes: ["Professional spotting instruction", "All mats and props provided", "Beginner-friendly progressions", "Photo documentation", "Refreshments"],
    teacher: "Sachin Rautela",
    teacherImg: IMG.sachin,
    featured: false,
    color: "from-amber-500 to-orange-500",
  },
  {
    slug: "arm-balancing",
    title: "Arm Balancing Workshop",
    subtitle: "Crow Pose to Handstand",
    description: "Unlock the secrets of arm balancing. From Bakasana (Crow) to Koundinyasana, learn the precise techniques, strength-building progressions, and mental focus required to fly on your hands.",
    longDesc: "Sachin Rautela brings his E-RYT 500 expertise to this technique-focused workshop. You'll learn the anatomy of arm balances, wrist preparation, core engagement secrets, and mental tools to overcome fear. Each pose is broken down into accessible progressions so anyone can experience the joy of balance.",
    image: IMG.armBalance,
    icon: Sparkles,
    price: 119,
    duration: "5 Hours",
    level: "Intermediate",
    upcoming: [
      { date: "Feb 25, 2026", time: "8:00 AM - 1:00 PM", spots: 8, total: 12 },
      { date: "Mar 12, 2026", time: "8:00 AM - 1:00 PM", spots: 5, total: 12 },
      { date: "Apr 2, 2026", time: "8:00 AM - 1:00 PM", spots: 10, total: 12 },
    ],
    benefits: [
      "Build shoulder and core strength systematically",
      "Learn precise alignment for safe practice",
      "Overcome mental blocks and fear of falling",
      "Understand the anatomy behind each pose",
      "Progress from beginner to advanced arm balances",
    ],
    includes: ["Detailed anatomy workshop", "Wall progressions for all poses", "Personalised feedback", "Video analysis of your practice", "Lunch break included"],
    teacher: "Sachin Rautela",
    teacherImg: IMG.sachin,
    featured: true,
    color: "from-rose-500 to-red-500",
  },
  {
    slug: "mandala-painting",
    title: "Mandala Painting Workshop",
    subtitle: "Meditative Art in Bali",
    description: "Create your own sacred mandala in this meditative art workshop. Using natural pigments and traditional Balinese techniques, you'll enter a state of flow as geometric patterns emerge from your brush.",
    longDesc: "Art meets meditation in this unique Balinese experience. Led by local Balinese artists, you'll learn the symbolism of mandala patterns, basic geometric construction, and how to use natural earth pigments. The repetitive, focused nature of the work creates a meditative state similar to walking meditation.",
    image: IMG.mandala,
    icon: Palette,
    price: 79,
    duration: "4 Hours",
    level: "All Levels",
    upcoming: [
      { date: "Feb 28, 2026", time: "10:00 AM - 2:00 PM", spots: 10, total: 14 },
      { date: "Mar 15, 2026", time: "10:00 AM - 2:00 PM", spots: 8, total: 14 },
      { date: "Apr 5, 2026", time: "10:00 AM - 2:00 PM", spots: 12, total: 14 },
    ],
    benefits: [
      "Experience meditative flow through art",
      "Learn Balinese artistic traditions",
      "Reduce anxiety and stress through focused creativity",
      "Create a personal artwork to take home",
      "Connect with Balinese culture authentically",
    ],
    includes: ["All art materials provided", "Natural pigment workshop", "Traditional Balinese guidance", "Your completed mandala to take home", "Herbal tea ceremony"],
    teacher: "Guest Artist",
    teacherImg: IMG.vivek,
    featured: false,
    color: "from-emerald-500 to-teal-500",
  },
];

const comboPackages = [
  {
    title: "Ultimate Yoga Experience",
    subtitle: "All 4 Workshops + 7-Day Retreat",
    price: 2499,
    originalPrice: 3285,
    savings: "Save €786",
    workshops: ["Sound Healing", "Acro Yoga", "Arm Balancing", "Mandala Painting"],
    included: ["7-Day Yoga Immersion Retreat", "All 4 workshops over 2 weeks", "Priority booking", "Private villa accommodation", "All meals included", "Certificate package"],
    featured: true,
  },
  {
    title: "Double Delight",
    subtitle: "Any 2 Workshops",
    price: 169,
    originalPrice: 198,
    savings: "Save €29",
    workshops: ["Sound Healing", "Acro Yoga", "Arm Balancing", "Mandala Painting"],
    included: ["2 workshops of your choice", "Flexible scheduling", "Progress tracking", "Photo documentation"],
    featured: false,
  },
  {
    title: "Workshop Intensive",
    subtitle: "All 4 Workshops (No Retreat)",
    price: 329,
    originalPrice: 386,
    savings: "Save €57",
    workshops: ["Sound Healing", "Acro Yoga", "Arm Balancing", "Mandala Painting"],
    included: ["All 4 workshops", "2-week access period", "Certificate of completion", "Workshop materials"],
    featured: false,
  },
];

const fallbackTestimonials = [
  { name: "Anna B.", text: "The sound healing with Mrs. Yuli was one of the most profound experiences of my life. I cried, I laughed, I felt completely renewed.", workshop: "Sound Healing", rating: 5 },
  { name: "Chris M.", text: "Never thought I could do arm balances! Sachin's progressions made it possible. Now I can hold crow for 30 seconds!", workshop: "Arm Balancing", rating: 5 },
  { name: "Lena K.", text: "Acro yoga was so much fun! Made great friends and learned to trust my body in completely new ways.", workshop: "Acro Yoga", rating: 5 },
];

const Workshops = () => {
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);

  useEffect(() => {
    void fetch("/api/testimonials?limit=3")
      .then((response) => response.json())
      .then((result) => {
        if (Array.isArray(result.testimonials) && result.testimonials.length > 0) {
          setTestimonials(
            result.testimonials.map((item: { name: string; course?: string | null; quote: string; rating?: number }) => ({
              name: item.name,
              workshop: item.course || "Bali YTTC Graduate",
              text: item.quote,
              rating: item.rating || 5,
            })),
          );
        }
      })
      .catch(console.error);
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-24 overflow-hidden bg-warm-dark">
        <div className="absolute inset-0">
          <img src={IMG.classMain} alt="Yoga Workshops in Bali" className="w-full h-full object-cover opacity-30" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-warm-dark via-warm-dark/80 to-warm-dark/30" />
        <div className="relative container-edit">
          <Reveal>
            <Link href="/" className="text-cream/60 hover:text-cream text-xs tracking-widest uppercase mb-6 inline-block">← Back to Home</Link>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="eyebrow text-gold-light mb-5">Workshops & Experiences</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="display-xl text-cream">
              Go Deeper. <em className="text-terra-light">Play Wider.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 text-cream/75 max-w-2xl text-lg leading-relaxed">
              Standalone workshops for those not doing a full training. Each is a complete experience — led by our senior teachers, in the heart of Ubud's sacred spaces. Choose one or combine them all.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap gap-4">
              <ApplyModal
                defaultCourse="workshop"
                trigger={
                  <Button className="bg-terra hover:bg-terra-deep text-cream h-12 px-8">
                    Book a Workshop
                  </Button>
                }
              />
              <Button variant="outline" className="h-12 border-cream/30 bg-transparent px-8 text-cream hover:bg-cream/10 hover:text-cream">
                View All Workshops
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Workshop Cards */}
      <section className="py-20 md:py-28 bg-sand">
        <div className="container-edit">
          <SectionHeading
            eyebrow="Available Workshops"
            title={<>Choose your <em className="text-terra">adventure</em></>}
            sub="Each workshop is a complete standalone experience. No previous experience needed for most workshops."
          />
          <div className="mt-14 space-y-16">
            {workshops.map((workshop, index) => {
              const IconComponent = workshop.icon;
              return (
                <Reveal key={workshop.slug}>
                  <div className={`grid lg:grid-cols-12 gap-8 lg:gap-12 items-start ${index % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                    {/* Image */}
                    <div className="lg:col-span-5 relative">
                      <div className={`aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br ${workshop.color} p-8 flex flex-col items-center justify-center text-center`}>
                        <IconComponent className="w-20 h-20 text-white/90 mb-4" />
                        <h3 className="display-sm text-white">{workshop.title}</h3>
                        <p className="text-white/70 mt-2">{workshop.subtitle}</p>
                        <div className="mt-6 flex items-center gap-4 text-white/80 text-sm">
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {workshop.duration}</span>
                          <span className="flex items-center gap-1"><Sparkles className="w-4 h-4" /> {workshop.level}</span>
                        </div>
                      </div>
                      {workshop.featured && (
                        <div className="absolute -top-2 -right-2 bg-terra text-cream text-xs font-bold px-3 py-1.5 rounded-full">
                          Popular
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-7">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-bold tracking-widest uppercase text-terra bg-terra/10 px-3 py-1 rounded-full">
                          {workshop.level}
                        </span>
                      </div>

                      <h2 className="display-md text-warm-dark">
                        {workshop.title}
                      </h2>
                      <p className="mt-2 text-terra font-medium">{workshop.subtitle}</p>
                      <p className="mt-4 text-ink-soft leading-relaxed">{workshop.description}</p>
                      <p className="mt-3 text-warm-mid leading-relaxed text-sm">{workshop.longDesc}</p>

                      {/* Benefits */}
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {workshop.benefits.map((b) => (
                          <div key={b} className="flex items-start gap-2 text-sm text-warm-dark">
                            <Check className="w-4 h-4 text-sage mt-0.5 shrink-0" />
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>

                      {/* Includes */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {workshop.includes.map((item) => (
                          <span key={item} className="text-xs bg-sage/20 text-sage px-2.5 py-1 rounded-full">
                            {item}
                          </span>
                        ))}
                      </div>

                      {/* Upcoming Dates */}
                      <div className="mt-6">
                        <p className="text-xs font-bold uppercase tracking-widest text-warm-light mb-3">Upcoming Sessions</p>
                        <div className="space-y-2">
                          {workshop.upcoming.map((session) => (
                            <div key={session.date} className="flex items-center justify-between bg-cream rounded-lg px-4 py-3">
                              <div className="flex items-center gap-4">
                                <Calendar className="w-4 h-4 text-terra shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold text-warm-dark">{session.date}</p>
                                  <p className="text-xs text-warm-light">{session.time}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-warm-mid">{session.spots}/{session.total} spots</span>
                                <ApplyModal
                                  defaultCourse={workshop.slug}
                                  trigger={
                                    <Button size="sm" className="bg-terra hover:bg-terra-deep text-cream h-8 px-4 text-xs">
                                      Book
                                    </Button>
                                  }
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Price & Teacher */}
                      <div className="mt-6 flex items-end justify-between gap-4 pt-4 border-t border-warm-dark/10">
                        <div className="flex items-center gap-3">
                          <img src={workshop.teacherImg} alt={workshop.teacher} className="w-10 h-10 rounded-full object-cover" />
                          <div>
                            <p className="text-xs text-warm-light">With</p>
                            <p className="text-sm font-semibold text-warm-dark">{workshop.teacher}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-warm-light uppercase tracking-wide">Per person</p>
                          <p className="price-value text-terra-deep">EUR {workshop.price}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Combo Packages */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="container-edit">
          <SectionHeading
            eyebrow="Save with Packages"
            title={<>Book more, <em className="text-terra">save more</em></>}
            sub="Combine workshops for a deeper experience. All packages include certificate of completion."
          />
          <div className="mt-14 grid md:grid-cols-3 gap-8">
            {comboPackages.map((pkg) => (
              <Reveal key={pkg.title}>
                <div className={`rounded-2xl p-7 h-full flex flex-col ${pkg.featured ? "bg-terra text-cream shadow-xl ring-2 ring-terra/30" : "bg-sand text-warm-dark"}`}>
                  {pkg.featured && (
                    <div className="bg-cream text-terra text-xs font-bold px-3 py-1 rounded-full w-fit mb-4">
                      Best Value
                    </div>
                  )}
                  <h3 className="display-sm">{pkg.title}</h3>
                  <p className={`mt-1 text-sm ${pkg.featured ? "text-cream/70" : "text-warm-light"}`}>{pkg.subtitle}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className={`price-value ${pkg.featured ? "text-cream" : "text-terra-deep"}`}>EUR {pkg.price}</span>
                    <span className={`text-sm line-through ${pkg.featured ? "text-cream/50" : "text-warm-light"}`}>EUR {pkg.originalPrice}</span>
                  </div>
                  <p className={`text-xs font-semibold mt-1 ${pkg.featured ? "text-cream/70" : "text-sage"}`}>{pkg.savings}</p>

                  <ul className={`mt-6 space-y-2 flex-1 ${pkg.featured ? "text-cream/80" : "text-warm-mid"}`}>
                    {pkg.included.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${pkg.featured ? "text-cream" : "text-sage"}`} />
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <ApplyModal
                      defaultCourse={`pkg-${pkg.title.toLowerCase().replace(/\s+/g, "-")}`}
                      trigger={
                        <Button className={`w-full h-12 ${pkg.featured ? "bg-cream text-terra hover:bg-cream/90" : "bg-terra text-cream hover:bg-terra-deep"}`}>
                          Book This Package <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      }
                    />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Teacher Spotlight */}
      <section className="py-20 md:py-28 bg-warm-dark text-cream">
        <div className="container-edit">
          <SectionHeading light eyebrow="Your Guides" title={<>Led by our <em className="text-terra-light">senior teachers</em></>} />
          <div className="mt-14 grid md:grid-cols-2 gap-8">
            {[
              { name: "Mrs. Yuli", role: "Sound Healing Specialist", img: IMG.yuli, text: "Yuli brings the gentle spirit of Bali to every workshop. Her sound healing sessions blend Himalayan traditions with Balinese sacred music for a truly unique experience." },
              { name: "Sachin Rautela", role: "E-RYT 500 | Acro & Arm Balance", img: IMG.sachin, text: "Sachin's anatomically precise teaching style makes complex poses accessible. His Acro Yoga workshops are playful, safe, and transformative." },
            ].map((teacher) => (
              <Reveal key={teacher.name}>
                <div className="flex gap-6 bg-white/5 rounded-xl p-6">
                  <img src={teacher.img} alt={teacher.name} className="w-20 h-20 rounded-full object-cover shrink-0" />
                  <div>
                    <p className="text-xs text-terra-light font-bold uppercase tracking-widest">{teacher.role}</p>
                    <h3 className="display-sm mt-1 text-cream">{teacher.name}</h3>
                    <p className="mt-2 text-cream/60 text-sm leading-relaxed">{teacher.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-sand">
        <div className="container-edit">
          <SectionHeading eyebrow="Workshop Reviews" title={<>What past participants <em className="text-terra">say</em></>} align="center" />
          <div className="mt-14 grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <Reveal key={t.name}>
                <div className="bg-cream rounded-xl p-7 shadow-sm">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-terra bg-terra/10 px-2 py-0.5 rounded-full">{t.workshop}</span>
                  <p className="mt-3 text-warm-dark leading-relaxed italic">"{t.text}"</p>
                  <div className="mt-4 pt-4 border-t border-warm-dark/10">
                    <p className="font-semibold text-warm-dark">{t.name}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="container-edit">
          <SectionHeading eyebrow="Common Questions" title={<>Workshop <em className="text-terra">FAQs</em></>} />
          <div className="mt-14 max-w-3xl mx-auto space-y-4">
            {[
              { q: "Do I need yoga experience to join?", a: "Most workshops are beginner-friendly! Sound Healing and Mandala Painting require no yoga experience. Acro Yoga is open to all fitness levels. Arm Balancing requires at least 3 months of regular yoga practice." },
              { q: "What should I bring?", a: "Comfortable clothing you can move in, a water bottle, and an open heart. We provide all props, mats, and materials. For Sound Healing, bring a blanket if you're sensitive to the cold." },
              { q: "Can I book multiple workshops?", a: "Yes! Book as many as you like. We offer combo packages for 2+ workshops at discounted rates. Workshops can be booked across different dates." },
              { q: "What if a workshop is full?", a: "Join the waitlist — we'll notify you if a spot opens up. You can also book a private session with our teachers for a more personalised experience." },
              { q: "Are workshops included in YTT programs?", a: "Many workshops are included in our 200hr and 300hr programs at no extra cost. Check your program schedule or contact us to confirm which workshops are included." },
            ].map((faq, i) => (
              <Reveal key={i}>
                <details className="group bg-sand rounded-lg">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-serif text-lg text-warm-dark hover:text-terra">
                    <span>{faq.q}</span>
                    <span className="text-terra group-open:rotate-45 transition-transform font-bold text-xl">+</span>
                  </summary>
                  <div className="px-5 pb-5 text-ink-soft leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-warm-dark text-center">
        <div className="container-edit max-w-3xl mx-auto">
          <Reveal>
            <h2 className="display-lg text-cream">
              Ready to <em className="text-terra-light">explore?</em>
            </h2>
            <p className="mt-6 text-cream/70 text-lg">
              Join our standalone workshops or combine with a full training. Small groups, personal attention, transformative experiences.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <ApplyModal
                defaultCourse="workshop"
                trigger={
                  <Button size="lg" className="bg-terra hover:bg-terra-deep text-cream h-14 px-10">
                    Book a Workshop Now
                  </Button>
                }
              />
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="h-14 border-cream/30 bg-transparent px-10 text-cream hover:bg-cream/10 hover:text-cream">
                  Chat With Us on WhatsApp
                </Button>
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default Workshops;
