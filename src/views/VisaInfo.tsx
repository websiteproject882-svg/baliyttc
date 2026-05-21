"use client";
import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ApplyModal } from "@/components/shared/ApplyModal";
import { Button } from "@/components/ui/button";
import { IMG, SITE } from "@/data/site";
import { Check, Clock, Plane, FileText, Shield, HelpCircle, ChevronRight, Globe, AlertTriangle, CheckCircle2 } from "lucide-react";

const visaTypes = [
  {
    name: "Tourist Visa (VOA)",
    subtitle: "Visa on Arrival — Easiest Option",
    icon: Plane,
    color: "bg-green-500",
    eligible: "Most European & English-speaking countries",
    duration: "30 days",
    extendable: "Yes — up to 30 more days",
    cost: "~$35 USD",
    bestFor: "Short courses, workshops, retreats (under 30 days)",
    requirements: [
      "Valid passport (6+ months validity)",
      "Return flight ticket",
      "Proof of accommodation",
      "Sufficient funds (~$100/day recommended)",
    ],
    steps: [
      "Fill out the digital customs form on your flight (Indonesia has moved to e-CD)",
      "Land at Ngurah Rai International Airport (DPS)",
      "Proceed to the Visa on Arrival counter before immigration",
      "Pay the $35 USD fee (or equivalent in EUR)",
      "Receive 30-day stamped passport",
    ],
    pros: ["No pre-application needed", "Instant approval", "Available at all major airports", "Easy extension available"],
    cons: ["Only 30 days (or 60 with extension)", "Cannot convert to other visa types", "Cannot work or study formally"],
  },
  {
    name: "B211A Visa",
    subtitle: "Social/Cultural Visa — For Longer Stays",
    icon: FileText,
    color: "bg-blue-500",
    eligible: "Anyone — especially for 60+ day programs",
    duration: "60 days",
    extendable: "Yes — up to 4 extensions (180 days total)",
    cost: "~$50 USD + agent fees",
    bestFor: "100hr, 200hr YTT programs (21 days + travel)",
    requirements: [
      "Valid passport (6+ months validity)",
      "Return flight ticket (can be open-jaw)",
      "Proof of accommodation or sponsor letter",
      "Bank statement showing sufficient funds",
      "Passport-size photos (2)",
      "Sponsor letter from Bali host (we provide this)",
    ],
    steps: [
      "Apply through a trusted visa agent in your country OR our recommended partner",
      "Receive approval letter via email (2-5 business days)",
      "Fly to Bali with your approval letter printed",
      "Show approval letter + passport at immigration",
      "Pay the extension fee on arrival",
      "Receive 60-day stamped passport",
    ],
    pros: ["60 days initial stay", "Can be extended multiple times", "Most popular for YTT students", "Can switch to other visas"],
    cons: ["Requires pre-arrangement", "Agent fees apply", "Extension process takes 1-2 weeks"],
  },
  {
    name: "Digital Nomad Visa (B211A-based)",
    subtitle: "For Remote Workers Combining Study + Work",
    icon: Globe,
    color: "bg-purple-500",
    eligible: "Remote workers, digital nomads, freelancers",
    duration: "5 years (multiple entries)",
    extendable: "Annual extensions",
    cost: "~€100/year",
    bestFor: "Those combining YTT with remote work",
    requirements: [
      "Proof of remote income (~$2,000/month)",
      "Valid passport (6+ months validity)",
      "Health insurance covering Indonesia",
      "Sponsor letter from Indonesian company (we assist)",
      "Clean criminal record",
    ],
    steps: [
      "Apply through official channels or visa specialist",
      "Gather income proof and insurance documents",
      "Receive approval within 30 days",
      "Travel to Bali and register with local authorities",
      "Renew annually while enjoying Bali lifestyle",
    ],
    pros: ["Long-term stay option", "Work legally while studying", "Multiple entries over 5 years", "Path to KITAS (long-term stay)"],
    cons: ["Higher income requirement", "More documentation", "Longer processing time"],
  },
];

const countryGuides = [
  {
    region: "European Union",
    countries: "Germany, France, Spain, Italy, Netherlands, Belgium, Austria, Switzerland, UK, Ireland, Sweden, Norway, Denmark, Finland, Portugal, Poland, Czech Republic, Greece",
    visa: "Tourist Visa (VOA) — EU citizens get 30 days free on arrival",
    note: "No fee for EU citizens. Simply fly in and show your return ticket. Extend up to 30 more days at immigration office.",
    travelInsurance: "Recommended but not mandatory. Highly recommended for yoga students.",
    recommendedVisa: "B211A for 200hr+ programs",
    flag: "🇪🇺",
  },
  {
    region: "United States & Canada",
    countries: "USA, Canada",
    visa: "Tourist Visa (VOA) — 30 days for USD $35",
    note: "US and Canadian citizens get 30 days on arrival. Easy extension available.",
    travelInsurance: "Not mandatory but essential — US health insurance won't cover Bali.",
    recommendedVisa: "B211A for 200hr+ programs",
    flag: "🌎",
  },
  {
    region: "Australia & New Zealand",
    countries: "Australia, New Zealand",
    visa: "Tourist Visa (VOA) — 30 days",
    note: "Australian citizens can extend once for 30 more days. NZ citizens same.",
    travelInsurance: "Highly recommended. Australian OSHC may not cover overseas.",
    recommendedVisa: "B211A for 300hr programs",
    flag: "🌏",
  },
  {
    region: "Asia Pacific",
    countries: "Singapore, Malaysia, Thailand, Philippines, Japan, South Korea",
    visa: "Most get 30 days VOA — some countries have reciprocal agreements",
    note: "Singapore and Malaysia citizens: 30 days free. Japan/Korea: 30 days free.",
    travelInsurance: "Recommended for longer programs.",
    recommendedVisa: "B211A for 200hr+ programs",
    flag: "🌏",
  },
];

const timeline = [
  { step: "3-4 weeks before", action: "Check passport validity (must be 6+ months from arrival)", icon: Clock },
  { step: "3 weeks before", action: "Book flights & arrange travel insurance", icon: Plane },
  { step: "2-3 weeks before", action: "Apply for B211A visa if needed (for 60+ day programs)", icon: FileText },
  { step: "1 week before", action: "Receive confirmation letter & enrollment details from us", icon: Check },
  { step: "1-3 days before", action: "Fill out digital customs form (e-CD) on your airline's website", icon: Globe },
  { step: "Arrival in Bali", action: "Clear immigration, get visa stamp, collect bags", icon: CheckCircle2 },
];

const faqs = [
  { q: "Can I extend my visa while in Bali?", a: "Yes! The Visa on Arrival can be extended once for 30 more days. The B211A visa can be extended up to 4 times (180 days total). Our team can recommend trusted visa agents who handle extensions in 1-2 weeks." },
  { q: "What if my passport expires in less than 6 months?", a: "You must renew your passport before applying for any visa or travelling to Indonesia. Most countries' passport services take 2-4 weeks. Start this process as early as possible." },
  { q: "Can I work on a tourist visa?", a: "Technically no — tourist and social visas do not permit formal employment. However, if you're working remotely for a company outside Indonesia (digital nomad style), this is in a grey area. For the Digital Nomad Visa, work is permitted. If in doubt, consult a visa specialist." },
  { q: "Do I need travel insurance?", a: "It's not legally required for entry, but we STRONGLY recommend it. Indonesian healthcare is affordable but private hospitals can be expensive for foreigners. Comprehensive travel insurance with medical evacuation is essential for peace of mind." },
  { q: "What happens if I overstay my visa?", a: "Overstaying incurs a fine of IDR 1,000,000 per day (approximately $60 USD per day). Beyond fines, repeated overstays can result in immigration blacklisting. Always extend before expiry — it's straightforward and affordable." },
  { q: "Can I do a yoga teacher training on a tourist visa?", a: "Technically, tourist visas are for tourism. However, yoga training schools in Bali operate in a grey area. The B211A social/cultural visa is the preferred and safer option for YTT students as it explicitly covers 'social' activities like yoga courses." },
  { q: "Is Bali safe for solo female travellers?", a: "Bali is generally very safe for solo travellers, including women. Our school environment is supportive and our community is international. Many students travel solo and leave with lifelong friends. Standard travel precautions apply." },
  { q: "Can I arrive early or stay after my program?", a: "Absolutely! We recommend arriving 1-2 days before your program starts to adjust to the timezone and settle in. Many students extend their stay for travel. Just ensure your visa covers your full intended duration." },
];

const VisaInfo = () => {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-24 overflow-hidden bg-warm-dark">
        <div className="absolute inset-0">
          <img src={IMG.certified} alt="Visa Information for Bali" className="w-full h-full object-cover opacity-25" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-warm-dark via-warm-dark/80 to-warm-dark/30" />
        <div className="relative container-edit">
          <Reveal>
            <Link href="/" className="text-cream/60 hover:text-cream text-xs tracking-widest uppercase mb-6 inline-block">← Back to Home</Link>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="eyebrow text-gold-light mb-5">Bali Travel Guide</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="display-xl text-cream">
              Visa & Travel <em className="text-terra-light">Guide</em>
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-6 text-cream/75 max-w-2xl text-lg leading-relaxed">
              Everything you need to know about entering Bali for your yoga training. We've helped thousands of students from Europe, America, and beyond — here's our complete guide.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#visa-types">
                <Button className="bg-terra hover:bg-terra-deep text-cream h-12 px-8">
                  View Visa Options
                </Button>
              </a>
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="h-12 border-cream/30 bg-transparent px-8 text-cream hover:bg-cream/10 hover:text-cream">
                  Ask About Your Visa
                </Button>
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Quick Overview */}
      <section className="py-16 md:py-20 bg-cream">
        <div className="container-edit">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Visa-Free / VOA", value: "30+ countries", icon: Globe },
              { label: "Max Stay", value: "180 days", icon: Clock },
              { label: "Processing", value: "On arrival / 5 days", icon: FileText },
              { label: "Cost", value: "From $35 USD", icon: Check },
            ].map((stat) => (
              <Reveal key={stat.label}>
                <div className="bg-sand rounded-xl p-5 text-center">
                  <stat.icon className="w-8 h-8 text-terra mx-auto mb-3" />
                  <p className="number-value text-warm-dark">{stat.value}</p>
                  <p className="text-xs text-warm-light mt-1">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-8 bg-amber-50 border-y border-amber-200">
        <div className="container-edit">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Important Note</p>
              <p className="text-sm text-amber-800 mt-1">Visa regulations change periodically. Always verify current requirements with the Indonesian Embassy in your country or use a trusted visa agent. Our team can recommend partners who specialise in yoga student visas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Visa Types */}
      <section id="visa-types" className="py-20 md:py-28 bg-sand">
        <div className="container-edit">
          <SectionHeading
            eyebrow="Visa Options"
            title={<>Choose the right <em className="text-terra">visa</em> for your training</>}
            sub="Most yoga students use either the Visa on Arrival (VOA) or the B211A Social/Cultural Visa. Here's what you need to know."
          />
          <div className="mt-14 space-y-8">
            {visaTypes.map((visa) => {
              const IconComponent = visa.icon;
              return (
                <Reveal key={visa.name}>
                  <div className="bg-cream rounded-2xl overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-warm-dark to-warm-dark/90 p-6 md:p-8">
                      <div className="flex items-start gap-4">
                        <div className={`${visa.color} p-3 rounded-xl`}>
                          <IconComponent className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="display-sm text-cream">{visa.name}</h3>
                          <p className="text-cream/70 mt-1">{visa.subtitle}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/10 rounded-lg p-3">
                          <p className="text-xs text-cream/60">Duration</p>
                          <p className="text-sm font-bold text-cream mt-0.5">{visa.duration}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <p className="text-xs text-cream/60">Extendable</p>
                          <p className="text-sm font-bold text-cream mt-0.5">{visa.extendable}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <p className="text-xs text-cream/60">Cost</p>
                          <p className="text-sm font-bold text-cream mt-0.5">{visa.cost}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <p className="text-xs text-cream/60">Best For</p>
                          <p className="text-sm font-bold text-cream mt-0.5">{visa.bestFor}</p>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
                      {/* Requirements */}
                      <div>
                        <h4 className="font-bold text-warm-dark mb-4 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-terra" />
                          Requirements
                        </h4>
                        <ul className="space-y-2">
                          {visa.requirements.map((req) => (
                            <li key={req} className="flex items-start gap-2 text-sm text-warm-mid">
                              <CheckCircle2 className="w-4 h-4 text-sage shrink-0 mt-0.5" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Steps */}
                      <div>
                        <h4 className="font-bold text-warm-dark mb-4 flex items-center gap-2">
                          <ChevronRight className="w-4 h-4 text-terra" />
                          How to Apply
                        </h4>
                        <ol className="space-y-3">
                          {visa.steps.map((step, i) => (
                            <li key={step} className="flex items-start gap-3 text-sm text-warm-mid">
                              <span className="w-5 h-5 rounded-full bg-terra/10 text-terra text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Pros & Cons */}
                      <div>
                        <h4 className="font-bold text-warm-dark mb-4 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-terra" />
                          Pros & Considerations
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-bold text-sage uppercase tracking-wide mb-2">✅ Advantages</p>
                            <ul className="space-y-1">
                              {visa.pros.map((pro) => (
                                <li key={pro} className="flex items-start gap-2 text-sm text-warm-mid">
                                  <Check className="w-3.5 h-3.5 text-sage shrink-0 mt-0.5" />
                                  {pro}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-warm-light uppercase tracking-wide mb-2">⚠️ Considerations</p>
                            <ul className="space-y-1">
                              {visa.cons.map((con) => (
                                <li key={con} className="flex items-start gap-2 text-sm text-warm-mid">
                                  <div className="w-1.5 h-1.5 rounded-full bg-warm-light mt-1.5 shrink-0" />
                                  {con}
                                </li>
                              ))}
                            </ul>
                          </div>
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

      {/* Country-Specific Guide */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="container-edit">
          <SectionHeading
            eyebrow="Country Guide"
            title={<>Visa info for <em className="text-terra">your country</em></>}
            sub="Select your region to find specific guidance based on where you're travelling from."
          />
          <div className="mt-14 space-y-6">
            {countryGuides.map((guide) => (
              <Reveal key={guide.region}>
                <div className="bg-sand rounded-xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{guide.flag}</span>
                    <h3 className="display-sm text-warm-dark">{guide.region}</h3>
                  </div>
                  <p className="text-sm text-warm-mid mb-3"><strong className="text-warm-dark">Countries:</strong> {guide.countries}</p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-cream rounded-lg p-4">
                      <p className="text-xs font-bold text-terra uppercase tracking-wide mb-2">Visa Required</p>
                      <p className="text-sm text-warm-dark font-medium">{guide.visa}</p>
                      <p className="text-xs text-warm-light mt-2">{guide.note}</p>
                    </div>
                    <div className="bg-cream rounded-lg p-4">
                      <p className="text-xs font-bold text-terra uppercase tracking-wide mb-2">Travel Insurance</p>
                      <p className="text-sm text-warm-dark">{guide.travelInsurance}</p>
                    </div>
                    <div className="bg-cream rounded-lg p-4">
                      <p className="text-xs font-bold text-terra uppercase tracking-wide mb-2">Recommended</p>
                      <p className="text-sm text-warm-dark font-medium">{guide.recommendedVisa}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 md:py-28 bg-warm-dark text-cream">
        <div className="container-edit">
          <SectionHeading light eyebrow="Application Timeline" title={<>When to <em className="text-terra-light">prepare</em></>} sub="Follow this timeline to ensure everything is ready before you fly." />
          <div className="mt-14 max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute left-6 top-2 bottom-2 w-px bg-terra/30" />
              <div className="space-y-6">
                {timeline.map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <Reveal key={item.step} delay={i * 0.05}>
                      <div className="relative flex items-start gap-6">
                        <div className="relative z-10 w-12 h-12 rounded-full bg-terra flex items-center justify-center shrink-0">
                          <IconComponent className="w-5 h-5 text-cream" />
                        </div>
                        <div className="bg-white/5 rounded-xl p-5 flex-1">
                          <p className="text-xs font-bold text-terra-light uppercase tracking-widest">{item.step}</p>
                          <p className="text-cream mt-1">{item.action}</p>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Provide */}
      <section className="py-20 md:py-28 bg-cream">
        <div className="container-edit">
          <SectionHeading
            eyebrow="We Help You"
            title={<>What we provide for your <em className="text-terra">visa process</em></>}
            sub="We support every student through the visa process with documentation, advice, and partner recommendations."
          />
          <div className="mt-14 grid md:grid-cols-3 gap-8">
            {[
              { icon: FileText, title: "Enrollment Confirmation", desc: "Official letter confirming your enrollment, dates, and program details — required for B211A applications." },
              { icon: Globe, title: "Sponsor Letter", desc: "We provide a sponsor letter for B211A visa applications, signed by our registered Indonesian entity." },
              { icon: HelpCircle, title: "Visa Support", desc: "WhatsApp support for visa questions. We recommend trusted agents who handle hundreds of YTT student visas." },
              { icon: Plane, title: "Arrival Guide", desc: "Detailed arrival guide with airport pickup options, what to expect at immigration, and how to reach our school." },
              { icon: Shield, title: "Insurance Recommendations", desc: "We recommend travel insurance providers that offer comprehensive coverage for Bali including medical evacuation." },
              { icon: CheckCircle2, title: "Extension Help", desc: "If you need to extend your visa while in Bali, we connect you with fast, reliable immigration agents." },
            ].map((item) => (
              <Reveal key={item.title}>
                <div className="bg-sand rounded-xl p-6">
                  <item.icon className="w-8 h-8 text-terra mb-4" />
                  <h3 className="display-sm text-warm-dark">{item.title}</h3>
                  <p className="mt-2 text-sm text-warm-mid leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 bg-sand">
        <div className="container-edit">
          <SectionHeading eyebrow="Common Questions" title={<>Visa <em className="text-terra">FAQs</em></>} />
          <div className="mt-14 max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
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
              Still have visa <em className="text-terra-light">questions?</em>
            </h2>
            <p className="mt-6 text-cream/70 text-lg">
              Our team has helped thousands of students from Europe and around the world navigate the Bali visa process. We're here to help — just send us a message.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white h-14 px-10">
                  Chat on WhatsApp
                </Button>
              </a>
              <ApplyModal
                defaultCourse="visa-inquiry"
                trigger={
                  <Button size="lg" variant="outline" className="h-14 border-cream/30 bg-transparent px-10 text-cream hover:bg-cream/10 hover:text-cream">
                    Apply for a Course
                  </Button>
                }
              />
            </div>
            <p className="mt-6 text-cream/40 text-sm">
              We respond within 24 hours. Visa questions are always free.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default VisaInfo;
