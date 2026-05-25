import { useLocale } from "next-intl";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { IMG, SITE } from "@/data/site";
import { getPageCopy } from "@/lib/page-i18n";

const About = () => {
  const locale = useLocale();
  const copy = getPageCopy(locale, "about");

  return (
    <>
      <section className="relative overflow-hidden bg-warm-dark pb-20 pt-40 text-cream">
        <div className="absolute inset-0">
          <img src={IMG.ceremony200} alt="" className="h-full w-full object-cover opacity-30" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-warm-dark via-warm-dark/85 to-warm-dark/40" />
        <div className="container-edit relative max-w-3xl">
          <Reveal>
            <p className="label-caps mb-6 text-gold-light">{copy.story}</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="display-xl text-cream">
              {copy.heroTitle} <em className="text-terra-light">{copy.heroAccent}</em> {copy.heroSuffix}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="body-lg mt-7 text-cream/75">{copy.heroText}</p>
          </Reveal>
        </div>
      </section>

      <section className="bg-cream py-24 md:py-32">
        <div className="container-edit grid items-center gap-14 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <img src={IMG.classMain} alt={copy.imageAlt} className="aspect-[4/3] w-full rounded-lg object-cover shadow-elev-md" />
          </Reveal>
          <div className="lg:col-span-6">
            <SectionHeading
              eyebrow={copy.philosophyEyebrow}
              title={
                <>
                  {copy.philosophyTitle} <em className="text-terra">{copy.philosophyAccent}</em>
                </>
              }
            />
            <Reveal delay={0.1}>
              <div className="mt-7 space-y-5 leading-[1.85] text-ink-soft">
                <p>{copy.philosophyText1}</p>
                <p>{copy.philosophyText2}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-sand py-24 md:py-32">
        <div className="container-edit">
          <SectionHeading
            eyebrow={copy.milestonesEyebrow}
            title={
              <>
                {copy.milestonesTitle} <em className="text-terra">{copy.milestonesAccent}</em> {copy.milestonesSuffix}
              </>
            }
            align="center"
            className="mb-16"
          />
          <div className="relative mx-auto max-w-3xl">
            <div className="absolute bottom-0 left-4 top-0 w-px bg-terra/30 md:left-1/2" />
            {copy.milestones.map((milestone, index) => (
              <Reveal key={milestone.y} delay={index * 0.06}>
                <div className={`relative mb-12 grid gap-6 md:grid-cols-2 ${index % 2 === 0 ? "" : "md:[direction:rtl]"}`}>
                  <div className="pl-12 md:px-12 md:pl-0" style={{ direction: "ltr" }}>
                    <p className="number-value text-terra-deep">{milestone.y}</p>
                    <p className="display-sm mt-2 text-warm-dark">{milestone.t}</p>
                    <p className="mt-2 leading-relaxed text-ink-soft">{milestone.d}</p>
                  </div>
                  <span className="absolute left-4 top-3 h-3 w-3 -translate-x-1/2 rounded-full bg-terra ring-4 ring-sand md:left-1/2" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream py-24 md:py-32">
        <div className="container-edit text-center">
          <SectionHeading
            align="center"
            eyebrow={copy.statsEyebrow}
            title={
              <>
                {copy.statsTitle} <em className="text-terra">{copy.statsAccent}</em>
              </>
            }
          />
          <div className="mt-14 grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { n: SITE.graduates, l: copy.statGraduates },
              { n: "60+", l: copy.statCountries },
              { n: "4.9", l: copy.statRating },
              { n: "8 years", l: copy.statEstablished },
            ].map((stat) => (
              <Reveal key={stat.l}>
                <div>
                  <p className="number-value text-terra-deep">{stat.n}</p>
                  <p className="label-caps mt-3 text-warm-light">{stat.l}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
