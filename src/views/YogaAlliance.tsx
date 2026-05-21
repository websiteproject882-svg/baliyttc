import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Layers,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ApplyModal } from "@/components/shared/ApplyModal";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { IMG, SITE } from "@/data/site";

const credentials = [
  {
    title: "RYS 200 pathway",
    detail: "Our 200-hour training follows Yoga Alliance standards for foundational teacher education.",
    icon: Award,
  },
  {
    title: "RYS 300 pathway",
    detail: "Advanced study for graduates who want deeper methodology, practice and mentorship.",
    icon: GraduationCap,
  },
  {
    title: "RYT registration support",
    detail: "Graduates receive guidance on using their certificate for Yoga Alliance teacher registration.",
    icon: ClipboardCheck,
  },
  {
    title: `${SITE.graduates} graduates`,
    detail: "A global alumni community shaped by training in Ubud, Bali since 2018.",
    icon: Users,
  },
];

const standards = [
  "Structured contact hours across practice, philosophy, anatomy, teaching methodology and practicum.",
  "Daily supervised practice so students learn to teach from embodied experience.",
  "Assessment through attendance, class participation, teaching practice and final completion review.",
  "Certificate issued after successful completion and school approval.",
  "Training language and teaching standards designed for international students.",
];

const studyAreas = [
  {
    title: "Hatha, Ashtanga & Vinyasa",
    text: "Daily asana practice builds discipline, alignment awareness, breath-led movement and sequencing confidence.",
  },
  {
    title: "Yoga philosophy & lifestyle",
    text: "Study the Yoga Sutras, Bhagavad Gita, yogic ethics and practical ways to live yoga beyond the mat.",
  },
  {
    title: "Applied anatomy",
    text: "Learn functional anatomy, joint safety, modifications and posture mechanics for safer teaching.",
  },
  {
    title: "Teaching methodology",
    text: "Practice cueing, class planning, observation, student care, voice, pacing and holding a steady class space.",
  },
  {
    title: "Pranayama, meditation & mantra",
    text: "Train breathwork, concentration, mantra chanting and meditation as part of a complete yoga education.",
  },
  {
    title: "Adjustments & workshops",
    text: "Build practical skill through alignment labs, hands-on adjustment practice, ceremonies and integration sessions.",
  },
];

const faqs = [
  {
    q: "Is Bali YTTC Yoga Alliance registered?",
    a: "Yes. Bali YTTC is a Yoga Alliance registered school in Ubud, Bali, with training pathways aligned to internationally recognised teacher education standards.",
  },
  {
    q: "Which training is best for RYT-200?",
    a: "The 200-hour Yoga Teacher Training is the main foundation pathway for students who want to begin teaching and apply for RYT-200 registration after completion.",
  },
  {
    q: "Can I teach after graduation?",
    a: "After completing all course requirements and receiving your certificate, you can begin teaching. Many graduates also register with Yoga Alliance for international recognition.",
  },
  {
    q: "Is attendance important?",
    a: "Yes. Contact hours, practice teaching, workshops and assessments are part of certification. Students must complete required attendance and final approval.",
  },
];

const YogaAlliance = () => (
  <>
    <section className="relative overflow-hidden bg-warm-dark pt-40 pb-20 text-cream md:pb-28">
      <div className="absolute inset-0">
        <img src={IMG.certified} alt="" className="h-full w-full object-cover opacity-35" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-warm-dark via-warm-dark/90 to-warm-dark/45" />
      <div className="relative container-edit grid gap-12 lg:grid-cols-12 lg:items-end">
        <div className="max-w-3xl lg:col-span-7">
          <Reveal>
            <p className="label-caps mb-6 text-gold-light">Yoga Alliance Registered School</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="display-xl text-cream">
              International certification, grounded in <em className="text-terra-light">real practice</em>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="body-lg mt-7 max-w-2xl text-cream/75">
              Bali YTTC is a Yoga Alliance registered yoga school in Ubud, Bali. Since 2018, our trainings have helped students build a confident teaching foundation through Hatha, Ashtanga, Vinyasa, philosophy, anatomy and methodology.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-9 flex flex-wrap gap-4">
              <ApplyModal
                trigger={
                  <Button className="btn-primary h-12 rounded-none bg-brand px-7 text-white hover:bg-brand-dark">
                    Apply for 2026 Batch
                  </Button>
                }
              />
              <Button asChild variant="outline" className="btn-outline h-12 rounded-none border-cream/55 bg-transparent px-7 text-cream hover:bg-cream hover:text-warm-dark">
                <Link href="/courses">View Trainings</Link>
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="lg:col-span-5">
          <div className="rounded-lg border border-white/15 bg-white/10 p-6 backdrop-blur-md">
            <div className="grid grid-cols-2 gap-4">
              <img src={IMG.rys200} alt="Yoga Alliance RYS 200" className="mx-auto h-24 w-full object-contain rounded bg-white/95 p-4" />
              <img src={IMG.yogaAlliance} alt="Yoga Alliance RYS 300" className="mx-auto h-24 w-full object-contain rounded bg-white/95 p-4" />
            </div>
            <p className="mt-5 text-sm leading-6 text-cream/75">
              Certification standards matter because students are investing in a teaching path, not only a retreat. Our curriculum is built to be practical, structured and internationally understandable.
            </p>
          </div>
        </Reveal>
      </div>
    </section>

    <section className="bg-cream py-20 md:py-28">
      <div className="container-edit">
        <SectionHeading
          eyebrow="Accreditation"
          title={<>What this recognition <em className="text-terra">means</em></>}
          sub="The goal is simple: students should leave with a grounded personal practice, a professional teaching foundation, and a certificate that is understood worldwide."
          align="center"
          className="mb-12"
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {credentials.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={index * 0.05}>
                <div className="h-full rounded-lg border border-stone-200 bg-white p-6 shadow-[0_18px_45px_rgba(35,35,30,0.06)]">
                  <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-sage/10 text-sage">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="display-sm text-charcoal">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-ink-soft">{item.detail}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>

    <section className="bg-sand py-20 md:py-28">
      <div className="container-edit grid gap-12 lg:grid-cols-12 lg:items-center">
        <Reveal className="lg:col-span-6">
          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-elev-md">
            <img src={IMG.classMain} alt="Yoga Alliance certified yoga teacher training class in Bali" className="aspect-[4/3] w-full object-cover" />
          </div>
        </Reveal>
        <div className="lg:col-span-6">
          <SectionHeading
            eyebrow="Training standards"
            title={<>More than a logo on the <em className="text-terra">certificate</em></>}
            sub="A recognised teacher training needs clear structure, contact hours, supervised practice and honest evaluation."
          />
          <Reveal delay={0.1}>
            <div className="mt-7 space-y-4">
              {standards.map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-stone-200 bg-white/80 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
                  <p className="text-sm leading-6 text-ink-soft">{item}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>

    <section className="bg-cream py-20 md:py-28">
      <div className="container-edit">
        <SectionHeading
          eyebrow="Curriculum"
          title={<>What you study at <em className="text-terra">Bali YTTC</em></>}
          sub="The curriculum blends traditional yoga lineage with modern teaching skills so students can practice deeply and teach responsibly."
          className="mb-12"
        />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {studyAreas.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.04}>
              <div className="h-full rounded-lg border border-stone-200 bg-white p-6">
                <div className="mb-5 flex items-center gap-3">
                  <span className="label-caps text-terra">{String(index + 1).padStart(2, "0")}</span>
                  <span className="h-px flex-1 bg-stone-200" />
                </div>
                <h2 className="display-sm text-charcoal">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-warm-dark py-20 text-cream md:py-28">
      <div className="container-edit grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <SectionHeading
            light
            eyebrow="After graduation"
            title={<>A certificate with a <em className="text-terra-light">clear pathway</em></>}
            sub="Graduates leave with a completion certificate, practical teaching experience and guidance for the next professional step."
          />
        </div>
        <div className="grid gap-4 lg:col-span-7 md:grid-cols-2">
          {[
            { icon: ShieldCheck, title: "Completion review", text: "Certificate issued after attendance, practice work and final approval." },
            { icon: Globe2, title: "International use", text: "A Yoga Alliance aligned certificate is familiar to studios and students worldwide." },
            { icon: BookOpen, title: "Teacher foundation", text: "Students graduate with class planning, cueing and practice teaching experience." },
            { icon: HeartHandshake, title: "Alumni support", text: "Post-course school updates and community connection remain available." },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={index * 0.05}>
                <div className="rounded-lg border border-white/10 bg-white/[0.06] p-6">
                  <Icon className="mb-5 h-6 w-6 text-terra-light" />
                  <h2 className="display-sm text-cream">{item.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-cream/70">{item.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>

    <section className="bg-cream py-20 md:py-28">
      <div className="container-edit grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading
            eyebrow="Questions"
            title={<>Yoga Alliance <em className="text-terra">FAQ</em></>}
            sub="Simple answers for students checking certification before applying."
          />
        </div>
        <div className="space-y-4 lg:col-span-7">
          {faqs.map((item, index) => (
            <Reveal key={item.q} delay={index * 0.04}>
              <div className="rounded-lg border border-stone-200 bg-white p-6">
                <h2 className="display-sm text-charcoal">{item.q}</h2>
                <p className="mt-3 text-sm leading-6 text-ink-soft">{item.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>

    <section className="relative overflow-hidden bg-sage py-20 text-cream md:py-24">
      <div className="absolute inset-0">
        <img src={IMG.graduation} alt="" className="h-full w-full object-cover opacity-25" />
      </div>
      <div className="absolute inset-0 bg-sage/85" />
      <div className="relative container-edit text-center">
        <Reveal>
          <p className="label-caps mb-5 text-gold-light">Ready to train in Bali?</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="display-lg mx-auto max-w-2xl text-cream">
            Choose the training path that matches your practice and teaching goals.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-8 flex justify-center">
            <ApplyModal
              trigger={
                <Button className="btn-primary h-12 rounded-none bg-brand px-8 text-white hover:bg-brand-dark">
                  Apply for 2026 Batch
                </Button>
              }
            />
          </div>
        </Reveal>
      </div>
    </section>
  </>
);

export default YogaAlliance;
