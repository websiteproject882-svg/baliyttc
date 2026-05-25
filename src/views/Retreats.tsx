"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ApplyModal } from "@/components/shared/ApplyModal";
import { Button } from "@/components/ui/button";
import { IMG } from "@/data/site";
import { usePublicSiteSettings } from "@/lib/use-public-site-settings";
import { getPageCopy } from "@/lib/page-i18n";
import { Check, Calendar, MapPin, Clock, Users, Sun, Moon, Waves, Star, Heart } from "lucide-react";

const retreats = [
  {
    slug: "3-day-ubud",
    duration: "3 Days",
    location: "Ubud",
    tagline: "Quick Reset",
    title: "3-Day Yoga Retreat in Ubud",
    subtitle: "A mindful escape into Bali's spiritual heart",
    description: "Perfect for busy souls seeking a quick but profound reset. Immerse yourself in daily yoga, meditation, and the healing energy of Ubud's sacred temples and rice terraces.",
    image: IMG.beachYoga,
    price: 599,
    highlights: [
      "Daily morning & evening yoga sessions",
      "Balinese temple purification ceremony",
      "Rice terrace walk through Tegallalang",
      "Traditional Balinese lunch experience",
      "Sound healing session",
      "Ubud market cultural visit",
    ],
    schedule: [
      { day: "Day 1", activities: ["Welcome ceremony & intention setting", "Gentle evening yoga flow", "Welcome dinner with the group"] },
      { day: "Day 2", activities: ["Sunrise meditation & pranayama", "Hatha yoga workshop", "Temple purification ceremony", "Sound healing evening session"] },
      { day: "Day 3", activities: ["Final morning practice", "Rice terrace walk", "Closing ceremony & blessing"] },
    ],
    includes: ["Private accommodation", "All meals (sattvic vegetarian)", "All activities & ceremonies", "Return transfers from Ubud"],
    notIncluded: ["Flights", "Travel insurance", "Personal expenses"],
    nextDate: "Mar 15, 2026",
    seatsLeft: 6,
    featured: false,
  },
  {
    slug: "3-day-canggu",
    duration: "3 Days",
    location: "Canggu",
    tagline: "Beach Vibes",
    title: "3-Day Beach Yoga Retreat in Canggu",
    subtitle: "Flow with the ocean, find your rhythm",
    description: "For those who love the ocean's energy. Daily beach yoga at sunrise, surf lessons with local instructors, and sunset meditation by the sea. The perfect blend of adventure and stillness.",
    image: IMG.acroYoga,
    price: 649,
    highlights: [
      "Daily beach yoga at sunrise",
      "2-hour surf lesson with certified instructor",
      "Sunset meditation by the ocean",
      "Balinese cooking class",
      "Canggu sunset tour",
      "Access to pool & spa facilities",
    ],
    schedule: [
      { day: "Day 1", activities: ["Beach yoga at sunset", "Welcome dinner at beachfront restaurant", "Introduction & intention setting"] },
      { day: "Day 2", activities: ["Sunrise beach yoga & meditation", "Surf lesson (morning)", "Free time for beach & pools", "Cooking class: Balinese cuisine", "Sunset meditation"] },
      { day: "Day 3", activities: ["Morning beach yoga flow", "Free morning for surfing or relaxing", "Closing circle & blessings"] },
    ],
    includes: ["Private room at beachfront boutique hotel", "All breakfasts", "All activities", "Surf lessons", "Return transfers from Canggu"],
    notIncluded: ["Lunch & dinner", "Flights", "Travel insurance", "Personal expenses"],
    nextDate: "Mar 20, 2026",
    seatsLeft: 4,
    featured: false,
  },
  {
    slug: "7-day-ubud",
    duration: "7 Days",
    location: "Ubud",
    tagline: "Deep Immersion",
    title: "7-Day Yoga Immersion in Ubud",
    subtitle: "A complete transformation week in Bali's spiritual capital",
    description: "Our most popular retreat for those ready for deep inner work. Seven days of daily yoga, meditation, pranayama, temple ceremonies, and profound personal exploration in the healing energy of Ubud.",
    image: IMG.ceremony200,
    price: 1299,
    highlights: [
      "Daily morning & evening yoga (2 sessions/day)",
      "Pranayama & meditation workshops",
      "Temple purification ceremony",
      "Tegallalang & Campuhan ridge walk",
      "Waterfall excursion to Tegenungan",
      "Traditional Balinese healing session",
      "Full-daysilent meditation retreat",
      "Sound healing ceremony",
    ],
    schedule: [
      { day: "Day 1", activities: ["Arrival & welcome lunch", "Evening yoga nidra", "Welcome dinner & introductions"] },
      { day: "Day 2", activities: ["Sunrise meditation", "Hatha yoga practice", "Introduction to pranayama", "Temple purification ceremony"] },
      { day: "Day 3", activities: ["Morning meditation & asana", "Philosophy workshop", "Tegallalang rice terraces walk", "Evening restorative yoga"] },
      { day: "Day 4", activities: ["Silent meditation morning", "Journaling workshop", "Waterfall excursion", "Sound healing session"] },
      { day: "Day 5", activities: ["Morning practice", "Balinese healing session", "Free afternoon for rest or spa", "Partner yoga workshop"] },
      { day: "Day 6", activities: ["Sunrise hike to Mt. Batur (optional)", "Restorative afternoon", "Closing ceremony preparation", "Farewell dinner"] },
      { day: "Day 7", activities: ["Final morning practice & sharing", "Campuhan ridge walk", "Graduation ceremony & blessing"] },
    ],
    includes: ["6 nights private villa accommodation", "All vegetarian meals (breakfast, lunch, dinner)", "All activities & ceremonies", "All transfers within Ubud", "Welcome kit & retreat materials"],
    notIncluded: ["Flights", "Visa fees", "Travel insurance", "Optional spa treatments", "Personal expenses"],
    nextDate: "Apr 1, 2026",
    seatsLeft: 8,
    featured: true,
  },
  {
    slug: "7-day-canggu",
    duration: "7 Days",
    location: "Canggu",
    tagline: "Ocean Wisdom",
    title: "7-Day Ocean Yoga Retreat in Canggu",
    subtitle: "Where the sea meets stillness",
    description: "A week of ocean-inspired yoga, surf, and self-discovery. Wake to sunrise flows on the beach, ride the waves, and close each day with sunset meditation. Perfect for water lovers seeking transformation.",
    image: IMG.armBalance,
    price: 1399,
    highlights: [
      "Daily beach yoga (sunrise & sunset)",
      "4 surf lessons over the week",
      "Stand-up paddleboarding session",
      "Balinese water ceremony",
      "Ocean-themed meditation workshops",
      "Beachfront accommodation",
      "Sunset boat cruise",
      "Traditional healing ritual",
    ],
    schedule: [
      { day: "Day 1", activities: ["Arrival & beach welcome", "Evening sunset yoga flow", "Welcome dinner by the sea"] },
      { day: "Day 2", activities: ["Sunrise beach yoga", "Surf lesson (beginner friendly)", "Free beach time", "Evening meditation"] },
      { day: "Day 3", activities: ["Morning flow practice", "Surf lesson #2", "Balinese cooking class", "Sunset reflection circle"] },
      { day: "Day 4", activities: ["Stand-up paddleboarding", "Restorative beach yoga", "Free afternoon for exploration", "Sound healing under the stars"] },
      { day: "Day 5", activities: ["Morning beach practice", "Surf lesson #3", "Traditional Balinese healing session", "Ocean intention setting"] },
      { day: "Day 6", activities: ["Final surf session", "Beach yoga workshop", "Sunset boat cruise", "Farewell bonfire"] },
      { day: "Day 7", activities: ["Closing morning practice", "Beach ceremony & blessing", "Departures"] },
    ],
    includes: ["6 nights beachfront accommodation", "All breakfasts", "4 surf lessons", "All activities", "Sunset boat cruise", "Return airport transfers"],
    notIncluded: ["Lunch & dinner", "Flights", "Travel insurance", "Personal expenses"],
    nextDate: "Apr 10, 2026",
    seatsLeft: 5,
    featured: false,
  },
];

const fallbackTestimonials = [
  { name: "Maria K.", location: "Germany", text: "The 7-day Ubud retreat was exactly what I needed. The temple ceremony and sound healing were transformative experiences.", rating: 5 },
  { name: "James L.", location: "Australia", text: "Canggu retreat was perfect — surf lessons combined with yoga was an incredible combination. Instructors were patient and supportive.", rating: 5 },
  { name: "Sophie R.", location: "France", text: "I came stressed from work and left feeling completely renewed. The daily schedule was balanced perfectly between activity and rest.", rating: 5 },
];

const Retreats = () => {
  const locale = useLocale();
  const copy = getPageCopy(locale, "pageHero");
  const siteSettings = usePublicSiteSettings();
  const [testimonials, setTestimonials] = useState(fallbackTestimonials);

  useEffect(() => {
    void fetch("/api/testimonials?limit=3")
      .then((response) => response.json())
      .then((result) => {
        if (Array.isArray(result.testimonials) && result.testimonials.length > 0) {
          setTestimonials(
            result.testimonials.map((item: { name: string; location?: string | null; quote: string; rating?: number }) => ({
              name: item.name,
              location: item.location || "Bali YTTC Graduate",
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
          <img src={IMG.certified} alt="Yoga Retreat in Bali" className="w-full h-full object-cover opacity-40" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-warm-dark via-warm-dark/80 to-warm-dark/30" />
        <div className="relative container-edit">
          <Reveal>
            <Link href="/" className="text-cream/60 hover:text-cream text-xs tracking-widest uppercase mb-6 inline-block">← {copy.backHome}</Link>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="eyebrow text-gold-light mb-5">{copy.retreatsEyebrow}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="display-xl text-cream">
              {copy.retreatsTitle} <em className="text-terra-light">{copy.retreatsAccent}</em>
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 text-cream/75 max-w-2xl text-lg leading-relaxed">
              {copy.retreatsIntro}
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button className="bg-terra hover:bg-terra-deep text-cream h-12 px-8">
                {copy.bookRetreat}
              </Button>
              <Button variant="outline" className="h-12 border-cream/30 bg-transparent px-8 text-cream hover:bg-cream/10 hover:text-cream">
                {copy.viewRetreats}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Retreat Type Selector */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="container-edit">
          <div className="flex flex-wrap gap-3 justify-center">
            {["All Retreats", "3-Day", "7-Day", "Ubud", "Canggu"].map((filter, i) => (
              <button
                key={filter}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  i === 0
                    ? "bg-terra text-cream"
                    : "bg-sand text-warm-dark hover:bg-terra/10 hover:text-terra"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Retreat Cards */}
      <section className="py-12 md:py-20 bg-sand">
        <div className="container-edit">
          <div className="space-y-16">
            {retreats.map((retreat, index) => (
              <Reveal key={retreat.slug}>
                <div className={`grid lg:grid-cols-12 gap-8 lg:gap-12 items-start ${index % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                  {/* Image */}
                  <div className="lg:col-span-6 relative">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden">
                      <img
                        src={retreat.image}
                        alt={retreat.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {retreat.featured && (
                      <div className="absolute top-4 left-4 bg-terra text-cream text-xs font-bold px-3 py-1.5 rounded-full">
                        Most Popular
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-warm-dark/80 backdrop-blur-sm text-cream text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      {retreat.location}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="lg:col-span-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold tracking-widest uppercase text-terra bg-terra/10 px-3 py-1 rounded-full">
                        {retreat.duration} Retreat
                      </span>
                      <span className="text-xs text-warm-light">{retreat.tagline}</span>
                    </div>

                    <h2 className="display-md text-warm-dark">
                      {retreat.title}
                    </h2>
                    <p className="mt-2 text-terra font-medium">{retreat.subtitle}</p>
                    <p className="mt-4 text-ink-soft leading-relaxed">{retreat.description}</p>

                    {/* Highlights */}
                    <div className="mt-6 grid grid-cols-2 gap-2">
                      {retreat.highlights.slice(0, 4).map((h) => (
                        <div key={h} className="flex items-start gap-2 text-sm text-warm-dark">
                          <Check className="w-4 h-4 text-sage mt-0.5 shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>

                    {/* Quick Info */}
                    <div className="mt-6 flex flex-wrap gap-4 text-sm text-warm-mid">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-terra" />
                        Next: {retreat.nextDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-terra" />
                        {retreat.seatsLeft} spots left
                      </span>
                    </div>

                    {/* Price & CTA */}
                    <div className="mt-6 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs text-warm-light uppercase tracking-wide">Starting from</p>
                        <p className="price-value text-terra-deep">EUR {retreat.price}</p>
                        <p className="text-xs text-warm-light">per person</p>
                      </div>
                      <ApplyModal
                        defaultCourse={retreat.slug}
                        trigger={
                          <Button className="bg-terra hover:bg-terra-deep text-cream h-12 px-8">
                            Book This Retreat
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Itinerary Section */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="container-edit">
          <SectionHeading
            eyebrow="Sample Schedule"
            title={<>What a typical <em className="text-terra">day</em> looks like</>}
            sub="Each retreat has a carefully designed daily rhythm that balances practice, exploration, and rest."
          />
          <div className="mt-14 grid md:grid-cols-3 gap-8">
            {[
              { icon: Sun, title: "Morning", time: "6:00 AM - 9:00 AM", items: ["Sunrise meditation", "Pranayama breathing", "Asana practice", "Breakfast"] },
              { icon: Waves, title: "Afternoon", time: "9:00 AM - 5:00 PM", items: ["Excursions & activities", "Cultural experiences", "Free time / rest", "Lunch included"] },
              { icon: Moon, title: "Evening", time: "5:00 PM - 9:00 PM", items: ["Evening yoga or meditation", "Dinner together", "Workshops or ceremonies", "Rest & reflection"] },
            ].map((slot) => (
              <Reveal key={slot.title}>
                <div className="bg-sand rounded-xl p-7">
                  <slot.icon className="w-8 h-8 text-terra mb-4" />
                  <h3 className="display-sm text-warm-dark">{slot.title}</h3>
                  <p className="text-xs text-terra font-medium mt-1">{slot.time}</p>
                  <ul className="mt-4 space-y-2">
                    {slot.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-ink-soft">
                        <div className="w-1.5 h-1.5 rounded-full bg-terra/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Includes/Not Includes */}
      <section className="py-20 md:py-28 bg-warm-dark text-cream">
        <div className="container-edit">
          <SectionHeading light eyebrow="What's Included" title={<>Everything you need for a <em className="text-terra-light">carefree</em> retreat</>} />
          <div className="mt-14 grid md:grid-cols-2 gap-10">
            <Reveal>
              <div className="bg-white/5 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-sage rounded-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="display-sm text-cream">Included in Your Retreat</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "Private accommodation (villa or boutique hotel)",
                    "All vegetarian meals (breakfast, lunch, or full board)",
                    "Daily yoga & meditation sessions",
                    "All activities & excursions",
                    "Temple ceremonies & cultural experiences",
                    "Welcome kit & retreat materials",
                    "Airport or local transfers",
                    "Certificate of completion",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-cream/80">
                      <Check className="w-5 h-5 text-sage shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="bg-white/5 rounded-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-terra/30 rounded-lg">
                    <Heart className="w-5 h-5 text-terra-light" />
                  </div>
                  <h3 className="display-sm text-cream">Not Included</h3>
                </div>
                <ul className="space-y-3">
                  {[
                    "International flights to/from Bali (DPS)",
                    "Travel insurance (mandatory)",
                    "Visa fees (tourist visa VOAs available on arrival)",
                    "Personal expenses & souvenirs",
                    "Spa treatments (available at additional cost)",
                    "Alcoholic beverages",
                    "Lunch & dinner (varies by retreat)",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-cream/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-cream/30 mt-2 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-sand">
        <div className="container-edit">
          <SectionHeading eyebrow="Retreat Reviews" title={<>What past guests <em className="text-terra">say</em></>} align="center" />
          <div className="mt-14 grid md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <Reveal key={t.name}>
                <div className="bg-cream rounded-xl p-7 shadow-sm">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-warm-dark leading-relaxed italic">"{t.text}"</p>
                  <div className="mt-4 pt-4 border-t border-warm-dark/10">
                    <p className="font-semibold text-warm-dark">{t.name}</p>
                    <p className="text-xs text-warm-light">{t.location}</p>
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
          <SectionHeading eyebrow="Common Questions" title={<>Retreat <em className="text-terra">FAQs</em></>} />
          <div className="mt-14 max-w-3xl mx-auto space-y-4">
            {[
              { q: "Do I need yoga experience to join a retreat?", a: "No experience is required for most retreats. Our teachers adapt to all levels, from complete beginners to advanced practitioners. If you have any specific concerns, let us know and we'll make accommodations." },
              { q: "What should I pack?", a: "Comfortable yoga clothes, a light layer for temple visits, swimwear, a sarong, sunscreen, and insect repellent. We'll provide yoga mats, props, and all retreat materials." },
              { q: "Can I arrive early or extend my stay?", a: "Absolutely! We can help arrange extended accommodation at the same venues or recommend nearby options. Just let us know when booking." },
              { q: "What if I have dietary restrictions?", a: "All meals are sattvic (vegetarian). We accommodate most dietary needs — vegan, gluten-free, etc. Just inform us at booking and our kitchen team will prepare accordingly." },
              { q: "Is it safe to travel to Bali alone?", a: "Bali is one of the safest destinations for solo travellers. Our retreats attract like-minded guests, and our team is available 24/7. Many guests travel solo and leave with new friends." },
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
              Ready to begin your <em className="text-terra-light">transformation?</em>
            </h2>
            <p className="mt-6 text-cream/70 text-lg">
              Join us in Bali for a retreat that will leave you feeling renewed, grounded, and inspired. Small groups, personal attention, life-changing experiences.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <ApplyModal
                defaultCourse="retreat"
                trigger={
                  <Button size="lg" className="bg-terra hover:bg-terra-deep text-cream h-14 px-10">
                    {copy.bookRetreat} Now
                  </Button>
                }
              />
              <a href={`https://wa.me/${siteSettings.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
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

export default Retreats;

