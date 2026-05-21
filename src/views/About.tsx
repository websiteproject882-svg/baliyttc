import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { IMG, SITE } from "@/data/site";

const milestones = [
  { y: 2018, t: "School founded", d: "Bali YTTC opens its doors in Ubud with our first 200-hour cohort." },
  { y: 2019, t: "Yoga Alliance RYS", d: "Officially registered as a Yoga Alliance school — RYS 200." },
  { y: 2021, t: "100hr & 300hr added", d: "Expanded our programme to welcome beginners and advanced teachers." },
  { y: 2024, t: "1,500+ graduates", d: "Our community of teachers spreads across 60+ countries." },
  { y: 2026, t: "2,500+ & growing", d: "A new ashram wing, more workshops, same lineage." },
];

const About = () => (
  <>
    <section className="pt-40 pb-20 bg-warm-dark text-cream relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={IMG.ceremony200} alt="" className="w-full h-full object-cover opacity-30" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-warm-dark via-warm-dark/85 to-warm-dark/40" />
      <div className="relative container-edit max-w-3xl">
        <Reveal><p className="label-caps mb-6 text-gold-light">Our story</p></Reveal>
        <Reveal delay={0.05}>
          <h1 className="display-xl text-cream">A school built on <em className="text-terra-light">lineage,</em> love & Bali.</h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="body-lg mt-7 text-cream/75">
            Since 2018, Bali Yoga Teacher Training Center has been guiding seekers from around the world into authentic, multi-style yoga teacher trainings — rooted in classical lineage and held in the gentle embrace of Ubud.
          </p>
        </Reveal>
      </div>
    </section>

    <section className="py-24 md:py-32 bg-cream">
      <div className="container-edit grid lg:grid-cols-12 gap-14 items-center">
        <Reveal className="lg:col-span-6">
          <img src={IMG.classMain} alt="Yoga class in Bali" className="rounded-lg w-full aspect-[4/3] object-cover shadow-elev-md" />
        </Reveal>
        <div className="lg:col-span-6">
          <SectionHeading eyebrow="Our philosophy" title={<>Yoga is more than <em className="text-terra">asana</em></>} />
          <Reveal delay={0.1}>
            <div className="mt-7 space-y-5 text-ink-soft leading-[1.85]">
              <p>We teach yoga as a complete way of life — body, breath, mind and spirit. Our trainings weave together the rigour of Hatha, the heat of Ashtanga, the flow of Vinyasa, and the depth of Yoga philosophy.</p>
              <p>We believe a true teacher first becomes a true student. That's why every cohort is small, every teacher is a senior practitioner, and every day includes time to embody — not just memorise.</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>

    <section className="py-24 md:py-32 bg-sand">
      <div className="container-edit">
        <SectionHeading eyebrow="Milestones" title={<>Our <em className="text-terra">journey</em> so far</>} align="center" className="mb-16" />
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-terra/30" />
          {milestones.map((m, i) => (
            <Reveal key={m.y} delay={i * 0.06}>
              <div className={`relative grid md:grid-cols-2 gap-6 mb-12 ${i % 2 === 0 ? "" : "md:[direction:rtl]"}`}>
                <div className="pl-12 md:pl-0 md:px-12" style={{ direction: "ltr" }}>
                  <p className="number-value text-terra-deep">{m.y}</p>
                  <p className="display-sm mt-2 text-warm-dark">{m.t}</p>
                  <p className="text-ink-soft mt-2 leading-relaxed">{m.d}</p>
                </div>
                <span className="absolute left-4 md:left-1/2 top-3 -translate-x-1/2 w-3 h-3 rounded-full bg-terra ring-4 ring-sand" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    <section className="py-24 md:py-32 bg-cream">
      <div className="container-edit text-center">
        <SectionHeading align="center" eyebrow="By the numbers" title={<>A community of <em className="text-terra">teachers</em></>} />
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { n: SITE.graduates, l: "Graduates" },
            { n: "60+", l: "Countries" },
            { n: "4.9★", l: "Google rating" },
            { n: "8 years", l: "Established" },
          ].map((s) => (
            <Reveal key={s.l}>
              <div>
                <p className="number-value text-terra-deep">{s.n}</p>
                <p className="label-caps mt-3 text-warm-light">{s.l}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  </>
);

export default About;
