"use client";
import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ApplyModal } from "@/components/shared/ApplyModal";
import { Button } from "@/components/ui/button";
import { IMG } from "@/data/site";
import { usePublicSiteSettings } from "@/lib/use-public-site-settings";
import { Check, Star, Calendar, Shield, Clock, ArrowRight, Sparkles, Zap, Percent } from "lucide-react";

const coursePricing = [
  {
    course: "100-Hour YTT",
    slug: "100hr",
    regularPrice: 1199,
    priceFrom: 999,
    deposit: 200,
    image: IMG.course100,
    duration: "11 Days",
    level: "Beginner",
    highlight: "Perfect first immersion",
    description: "Multi-style foundation for aspiring teachers. Learn the fundamentals of Hatha, Vinyasa, philosophy, and teaching methodology.",
    included: [
      "Yoga Alliance certification",
      "21 days intensive training",
      "Shared villa accommodation",
      "3 sattvic meals daily",
      "All workshops & ceremonies",
      "Temple excursions",
      "Course manual & materials",
      "Welcome & graduation ceremony",
    ],
    batches: [
      { date: "Feb 5 - Feb 15, 2026", price: 999, seats: 6, earlyBird: true, earlyBirdDeadline: "Jan 15, 2026", urgent: false },
      { date: "Jun 1 - Jun 11, 2026", price: 999, seats: 10, earlyBird: true, earlyBirdDeadline: "May 1, 2026", urgent: false },
      { date: "Sep 10 - Sep 20, 2026", price: 1099, seats: 12, earlyBird: false, urgent: false },
    ],
    featured: false,
  },
  {
    course: "200-Hour YTT",
    slug: "200hr",
    regularPrice: 1799,
    priceFrom: 1499,
    deposit: 300,
    image: IMG.course200,
    duration: "21 Days",
    level: "All Levels",
    highlight: "Flagship program",
    description: "Our most popular program. Become a certified Yoga Alliance teacher in 21 transformative days. Deep dive into Hatha, Ashtanga, Vinyasa, anatomy, and the art of teaching.",
    included: [
      "Yoga Alliance RYT-200 certification",
      "21 days immersive training",
      "Shared villa accommodation",
      "3 sattvic meals daily",
      "All workshops & ceremonies",
      "Temple & beach excursions",
      "Comprehensive course manual",
      "Adjustment training",
      "Teaching practice & feedback",
      "Welcome & graduation ceremony",
    ],
    batches: [
      { date: "Mar 2 - Mar 22, 2026", price: 1499, seats: 4, urgent: true, earlyBird: true, earlyBirdDeadline: "Feb 1, 2026" },
      { date: "May 4 - May 24, 2026", price: 1499, seats: 8, earlyBird: true, earlyBirdDeadline: "Apr 1, 2026" },
      { date: "Jul 6 - Jul 26, 2026", price: 1599, seats: 12, earlyBird: true, earlyBirdDeadline: "Jun 1, 2026" },
      { date: "Sep 1 - Sep 21, 2026", price: 1499, seats: 14, earlyBird: true, earlyBirdDeadline: "Aug 1, 2026" },
    ],
    featured: true,
  },
  {
    course: "300-Hour YTT",
    slug: "300hr",
    regularPrice: 2199,
    priceFrom: 1899,
    deposit: 400,
    image: IMG.course300,
    duration: "28 Days",
    level: "Advanced",
    highlight: "For certified teachers",
    description: "Advance your teaching with mastery modules in advanced asana, yoga therapy, Bhagavad Gita study, and mentorship. Complete your 500-hour path.",
    included: [
      "Yoga Alliance RYT-500 certification",
      "28 days advanced training",
      "Private villa upgrade included",
      "3 sattvic meals daily",
      "Advanced workshops",
      "1-on-1 mentorship sessions",
      "Yoga therapy training",
      "Teaching practicum",
      "Certification ceremony",
    ],
    batches: [
      { date: "Apr 6 - May 3, 2026", price: 1899, seats: 5, earlyBird: true, earlyBirdDeadline: "Mar 1, 2026", urgent: false },
      { date: "Oct 5 - Nov 1, 2026", price: 1899, seats: 10, earlyBird: true, earlyBirdDeadline: "Sep 1, 2026", urgent: false },
    ],
    featured: false,
  },
];

const retreatsPricing = [
  {
    name: "3-Day Retreat",
    location: "Ubud",
    price: 599,
    deposit: 150,
    includes: "Private room, breakfast, all activities",
    available: "Year-round",
  },
  {
    name: "3-Day Beach Retreat",
    location: "Canggu",
    price: 649,
    deposit: 150,
    includes: "Beachfront hotel, breakfast, surf lessons",
    available: "Year-round",
  },
  {
    name: "7-Day Yoga Immersion",
    location: "Ubud",
    price: 1299,
    deposit: 300,
    includes: "Private villa, all meals, all activities",
    available: "Year-round",
  },
  {
    name: "7-Day Ocean Retreat",
    location: "Canggu",
    price: 1399,
    deposit: 300,
    includes: "Beachfront hotel, all meals, surf lessons",
    available: "Year-round",
  },
];

const workshopsPricing = [
  { name: "Sound Healing Workshop", price: 89, duration: "3 hours" },
  { name: "Mandala Painting Workshop", price: 79, duration: "4 hours" },
  { name: "Acro Yoga Workshop", price: 99, duration: "4 hours" },
  { name: "Arm Balancing Workshop", price: 119, duration: "5 hours" },
  { name: "All 4 Workshops Bundle", price: 329, duration: "Save €57" },
];

const accommodationOptions = [
  {
    name: "Shared Villa",
    price: "Included",
    desc: "Twin room, private en-suite, AC, hot water, Wi-Fi",
    popular: false,
  },
  {
    name: "Private Villa",
    price: "+ €400",
    desc: "Private room with premium amenities, daily housekeeping",
    popular: true,
  },
];

const earlyBirdBenefits = [
  "Save up to €300 on your training",
  "Priority batch placement",
  "Extended payment window available",
  "Free welcome package upgrade",
  "First access to accommodation options",
];

const paymentOptions = [
  {
    title: "Full Payment",
    icon: Check,
    color: "bg-green-500",
    benefits: ["5% discount on full payment", "Immediate enrollment confirmation", "No future payment reminders"],
  },
  {
    title: "Deposit + Balance",
    icon: Clock,
    color: "bg-blue-500",
    benefits: ["Secure your spot from €200 deposit", "Balance due 30 days before arrival", "Flexible payment schedule"],
  },
  {
    title: "Installment Plan",
    icon: Calendar,
    color: "bg-purple-500",
    benefits: ["Split over 3-6 months", "Interest-free installments", "Designed for 300hr students"],
  },
];

const pricingFaqs = [
  { q: "What's included in the course fee?", a: "Everything: accommodation (shared villa), 3 sattvic vegetarian meals daily, all yoga sessions, workshops, ceremonies, excursions, course manual, and your Yoga Alliance certification. Flights, visa, and travel insurance are not included." },
  { q: "Is the deposit refundable?", a: "Deposits are partially refundable up to 30 days before the course start date (minus a €50 admin fee). Within 30 days, deposits are non-refundable but can be transferred to a future batch. Full payments can be cancelled up to 30 days before for a full refund." },
  { q: "Can I upgrade my accommodation?", a: "Yes. Private room upgrades are available for an additional fee and subject to availability. Simply let us know when booking and we'll arrange everything." },
  { q: "Are there any hidden costs?", a: "No hidden costs. Your course fee covers accommodation, meals, training, materials, and certification. Optional extras: private yoga sessions (€50/hr), spa treatments, additional excursions, and personal expenses." },
  { q: "What payment methods do you accept?", a: "We accept Razorpay, PayPal, and bank transfer (EUR preferred). All payments are processed securely. Currency is auto-detected but you can manually switch EUR/USD." },
  { q: "When do I need to pay the full amount?", a: "For deposit bookings, the balance is due 30 days before your course start date. You'll receive payment reminders at 45, 30, 14, and 7 days before. Installment plans are available for longer programs." },
  { q: "Is there an early bird discount?", a: "Yes! Early bird pricing is available for most batches — typically €100-300 off. Early bird prices are available until a set deadline (usually 30-60 days before the batch). After the deadline, regular pricing applies." },
  { q: "Do you offer group discounts?", a: "Yes! Groups of 3 or more students booking together receive a 5% group discount. Groups of 5+ receive 8%. Contact us directly to arrange group bookings and we'll process the discount manually." },
];

const Pricing = () => {
  const siteSettings = usePublicSiteSettings();

  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-24 overflow-hidden bg-warm-dark">
        <div className="absolute inset-0">
          <img src={IMG.certified} alt="Yoga Training Pricing Bali" className="w-full h-full object-cover opacity-25" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-warm-dark via-warm-dark/80 to-warm-dark/30" />
        <div className="relative container-edit">
          <Reveal>
            <Link href="/" className="text-cream/60 hover:text-cream text-xs tracking-widest uppercase mb-6 inline-block">← Back to Home</Link>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="eyebrow text-gold-light mb-5">Investment in Your Transformation</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="display-xl text-cream">
              Transparent <em className="text-terra-light">Pricing</em>
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 text-cream/75 max-w-2xl text-lg leading-relaxed">
              All-inclusive pricing — accommodation, meals, training, and certification. No hidden costs. Choose to pay in full or split your payment across time.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#courses">
                <Button className="bg-terra hover:bg-terra-deep text-cream h-12 px-8">
                  View Course Pricing
                </Button>
              </a>
              <Button variant="outline" className="h-12 border-cream/30 bg-transparent px-8 text-cream hover:bg-cream/10 hover:text-cream">
                Download Price Guide (PDF)
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Early Bird Banner */}
      <section className="py-6 bg-gradient-to-r from-terra to-terra-deep">
        <div className="container-edit">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-cream" />
              <p className="text-cream font-semibold">Early bird pricing available on select 2026 batches — save up to €300</p>
            </div>
            <ApplyModal
              defaultCourse="early-bird"
              trigger={
                <Button size="sm" className="bg-cream text-terra hover:bg-cream/90 h-9 px-5">
                  Check Early Bird Availability <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              }
            />
          </div>
        </div>
      </section>

      {/* Course Pricing Cards */}
      <section id="courses" className="py-20 md:py-28 bg-sand">
        <div className="container-edit">
          <SectionHeading
            eyebrow="Course Investment"
            title={<>Complete <em className="text-terra">training packages</em></>}
            sub="All prices in EUR. USD pricing available at checkout. Early bird discounts automatically applied where applicable."
          />
          <div className="mt-14 space-y-16">
            {coursePricing.map((course, index) => (
              <Reveal key={course.slug}>
                <div className={`grid lg:grid-cols-12 gap-8 items-start ${index % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                  {/* Left - Course Info */}
                  <div className="lg:col-span-5">
                    <div className="relative">
                      <img
                        src={course.image}
                        alt={course.course}
                        className="w-full aspect-[4/3] rounded-2xl object-cover"
                      />
                      {course.featured && (
                        <div className="absolute top-4 left-4 bg-terra text-cream text-xs font-bold px-3 py-1.5 rounded-full">
                          Most Popular
                        </div>
                      )}
                    </div>
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold tracking-widest uppercase text-terra bg-terra/10 px-3 py-1 rounded-full">{course.level}</span>
                        <span className="text-xs text-warm-light">{course.duration}</span>
                      </div>
                      <h2 className="display-md text-warm-dark">{course.course}</h2>
                      <p className="mt-2 text-ink-soft leading-relaxed">{course.description}</p>

                      {/* Includes */}
                      <div className="mt-6">
                        <p className="text-xs font-bold uppercase tracking-widest text-warm-light mb-3">What's Included</p>
                        <ul className="space-y-2">
                          {course.included.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-warm-dark">
                              <Check className="w-4 h-4 text-sage shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Right - Price & Batches */}
                  <div className="lg:col-span-7">
                    {/* Price Header */}
                    <div className="bg-warm-dark rounded-2xl p-6 md:p-8 text-cream mb-6">
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="price-label text-cream/60">Investment from</p>
                          <div className="flex items-baseline gap-3 mt-1">
                            <span className="price-value text-cream">EUR {course.priceFrom}</span>
                            {course.priceFrom < course.regularPrice && (
                              <span className="text-cream/50 line-through text-lg">EUR {course.regularPrice}</span>
                            )}
                          </div>
                          <p className="text-xs text-cream/60 mt-1">All-inclusive per person</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-cream/60">Or from</p>
                          <p className="price-value text-terra-light">EUR {course.deposit}</p>
                          <p className="text-xs text-cream/60">deposit to secure your spot</p>
                        </div>
                      </div>

                      {/* Currency Toggle */}
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-xs text-cream/60">Currency:</span>
                        <div className="flex gap-1">
                          {["EUR", "USD"].map((c) => (
                            <button
                              key={c}
                              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                c === "EUR"
                                  ? "bg-terra text-cream"
                                  : "bg-white/10 text-cream/70 hover:bg-white/20"
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        <span className="text-xs text-cream/60 ml-2">€1 ≈ $1.08</span>
                      </div>
                    </div>

                    {/* Batch Cards */}
                    <p className="text-xs font-bold uppercase tracking-widest text-warm-light mb-4">Available Batches 2026</p>
                    <div className="space-y-3">
                      {course.batches.map((batch) => (
                        <div
                          key={batch.date}
                          className={`rounded-xl p-4 border ${
                            batch.urgent
                              ? "bg-red-50 border-red-200"
                              : batch.earlyBird
                              ? "bg-amber-50 border-amber-200"
                              : "bg-cream border-warm-dark/10"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                batch.urgent ? "bg-red-100" : batch.earlyBird ? "bg-amber-100" : "bg-sand"
                              }`}>
                                <Calendar className={`w-5 h-5 ${
                                  batch.urgent ? "text-red-500" : batch.earlyBird ? "text-amber-600" : "text-warm-mid"
                                }`} />
                              </div>
                              <div>
                                <p className="font-semibold text-warm-dark text-sm">{batch.date}</p>
                                <p className="text-xs text-warm-light">{batch.seats} spots remaining</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {batch.earlyBird && (
                                <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                  <Zap className="w-3 h-3" /> Early Bird
                                </span>
                              )}
                              {batch.urgent && (
                                <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">
                                  <Sparkles className="w-3 h-3" /> Almost Full
                                </span>
                              )}
                              <div className="text-right">
                                <p className="price-value text-terra-deep">EUR {batch.price}</p>
                                {batch.earlyBird && (
                                  <p className="text-xs text-warm-light line-through">EUR {course.regularPrice}</p>
                                )}
                              </div>
                              <ApplyModal
                                defaultCourse={course.slug}
                                trigger={
                                  <Button size="sm" className="bg-terra hover:bg-terra-deep text-cream h-9 px-4">
                                    Book
                                  </Button>
                                }
                              />
                            </div>
                          </div>
                          {batch.earlyBird && batch.earlyBirdDeadline && (
                            <p className="mt-2 text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2 inline-flex items-center gap-1">
                              <Percent className="w-3 h-3" />
                              Early bird ends {batch.earlyBirdDeadline} — save EUR {course.regularPrice - batch.price}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Retreats & Workshops Quick Pricing */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="container-edit">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Retreats */}
            <div>
              <SectionHeading eyebrow="Retreats" title={<>Short <em className="text-terra">escapes</em></>} />
              <div className="mt-8 space-y-4">
                {retreatsPricing.map((retreat) => (
                  <div key={retreat.name} className="bg-sand rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-warm-dark">{retreat.name}</p>
                      <p className="text-xs text-warm-light">{retreat.location} · {retreat.includes}</p>
                    </div>
                    <div className="text-right">
                      <p className="price-value text-terra-deep">EUR {retreat.price}</p>
                      <p className="text-xs text-warm-light">from EUR {retreat.deposit} deposit</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Workshops */}
            <div>
              <SectionHeading eyebrow="Workshops" title={<>Standalone <em className="text-terra">experiences</em></>} />
              <div className="mt-8 space-y-4">
                {workshopsPricing.map((workshop) => (
                  <div key={workshop.name} className="bg-sand rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-warm-dark">{workshop.name}</p>
                      <p className="text-xs text-warm-light">{workshop.duration}</p>
                    </div>
                    <div className="text-right">
                      <p className="price-value text-terra-deep">EUR {workshop.price}</p>
                      {workshop.duration.includes("Save") && (
                        <p className="text-xs text-sage font-semibold">{workshop.duration}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accommodation */}
      <section className="py-20 md:py-28 bg-sand">
        <div className="container-edit">
          <SectionHeading
            eyebrow="Accommodation"
            title={<>Your home in <em className="text-terra">Ubud</em></>}
            sub="All courses include shared accommodation. Private room upgrades are available for added comfort, subject to availability."
          />
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {accommodationOptions.map((room) => (
              <Reveal key={room.name}>
                <div className={`rounded-2xl p-7 h-full border ${
                  room.popular
                    ? "bg-terra text-cream border-terra shadow-lg"
                    : "bg-cream text-warm-dark border-warm-dark/10"
                }`}>
                  {room.popular && (
                    <span className="bg-cream text-terra text-xs font-bold px-3 py-1 rounded-full">Most Chosen</span>
                  )}
                  <h3 className={`display-sm mt-4 ${room.popular ? "text-cream" : "text-warm-dark"}`}>
                    {room.name}
                  </h3>
                  <p className={`price-value mt-2 ${room.popular ? "text-cream" : "text-terra-deep"}`}>
                    {room.price}
                  </p>
                  <p className={`text-sm mt-3 leading-relaxed ${room.popular ? "text-cream/70" : "text-warm-mid"}`}>
                    {room.desc}
                  </p>
                  <ul className={`mt-4 space-y-2 ${room.popular ? "text-cream/80" : "text-warm-mid"}`}>
                    {["Private bathroom", "Air conditioning", "Hot water", "High-speed Wi-Fi", "Daily housekeeping"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className={`w-4 h-4 ${room.popular ? "text-cream" : "text-sage"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Early Bird Benefits */}
      <section className="py-20 md:py-28 bg-warm-dark text-cream">
        <div className="container-edit">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Reveal>
                <p className="eyebrow text-gold-light mb-5">Limited Time Offer</p>
                <h2 className="display-lg">
                  Early Bird <em className="text-terra-light">Benefits</em>
                </h2>
                <p className="mt-6 text-cream/70 leading-relaxed">
                  Book early and save. Early bird pricing is available on most 2026 batches — typically €100-300 off the regular price. Plus, early bookers get priority on accommodation choices.
                </p>
                <ApplyModal
                  defaultCourse="early-bird"
                  trigger={
                    <Button size="lg" className="mt-8 bg-terra hover:bg-terra-deep text-cream h-14 px-10">
                      Check Early Bird Availability <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  }
                />
              </Reveal>
            </div>
            <div>
              <Reveal delay={0.1}>
                <div className="space-y-4">
                  {earlyBirdBenefits.map((benefit, i) => (
                    <div key={benefit} className="flex items-start gap-4 bg-white/5 rounded-xl p-5">
                      <div className="w-10 h-10 rounded-full bg-terra/20 flex items-center justify-center shrink-0">
                        <Star className="w-5 h-5 text-terra-light" />
                      </div>
                      <p className="text-cream/90 font-medium pt-1.5">{benefit}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Payment Options */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="container-edit">
          <SectionHeading
            eyebrow="Flexible Payment"
            title={<>Pay in full or <em className="text-terra">split it</em></>}
            sub="We offer multiple payment options to make your training accessible. No interest, no hidden fees."
          />
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {paymentOptions.map((option) => (
              <Reveal key={option.title}>
                <div className="bg-sand rounded-2xl p-7 border border-warm-dark/5">
                  <div className={`${option.color} w-12 h-12 rounded-xl flex items-center justify-center mb-5`}>
                    <option.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="display-sm text-warm-dark">{option.title}</h3>
                  <ul className="mt-4 space-y-2">
                    {option.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-warm-mid">
                        <Check className="w-4 h-4 text-sage shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {[
              { icon: Shield, label: "Secure Payment", desc: "Razorpay & PayPal" },
              { icon: Check, label: "Free Cancellation", desc: "30 days before" },
              { icon: Zap, label: "Instant Confirmation", desc: "Email & WhatsApp" },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-3 bg-sand rounded-xl px-5 py-3">
                <badge.icon className="w-5 h-5 text-terra" />
                <div>
                  <p className="text-xs font-bold text-warm-dark">{badge.label}</p>
                  <p className="text-xs text-warm-light">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 bg-sand">
        <div className="container-edit">
          <SectionHeading eyebrow="Pricing Questions" title={<>FAQs</>} />
          <div className="mt-14 max-w-3xl mx-auto space-y-4">
            {pricingFaqs.map((faq, i) => (
              <Reveal key={i}>
                <details className="group bg-cream rounded-lg">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-serif text-lg text-warm-dark hover:text-terra">
                    <span>{faq.q}</span>
                    <span className="text-terra group-open:rotate-45 transition-transform font-bold text-xl">+</span>
                  </summary>
                  <div className="px-5 pb-5 text-warm-mid leading-relaxed">
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
              Ready to invest in your <em className="text-terra-light">transformation?</em>
            </h2>
            <p className="mt-6 text-cream/70 text-lg">
              No payment required to apply. Secure your spot with a deposit or pay in full and save. Our team is here to help you choose the right program.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <ApplyModal
                defaultCourse="pricing-inquiry"
                trigger={
                  <Button size="lg" className="bg-terra hover:bg-terra-deep text-cream h-14 px-10">
                    Apply for a Course
                  </Button>
                }
              />
              <a href={`https://wa.me/${siteSettings.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="h-14 border-cream/30 bg-transparent px-10 text-cream hover:bg-cream/10 hover:text-cream">
                  Chat on WhatsApp
                </Button>
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default Pricing;
