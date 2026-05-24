import { useState } from "react";
import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { getContactWhatsAppMessage, sendContactEmail } from "@/lib/emailjs";
import { usePublicSiteSettings } from "@/lib/use-public-site-settings";

const courseOptions = [
  "General question",
  "50-Hour Hatha Vinyasa YTT",
  "100-Hour Multi-Style YTT",
  "200-Hour Hatha Ashtanga Vinyasa YTT",
  "300-Hour Advanced YTT",
  "Retreats / Workshops",
  "Payment / Visa / Accommodation",
];

const contactSteps = [
  "Tell us your preferred course and dates.",
  "Admissions confirms availability and answers questions.",
  "Reserve your seat only when you are ready to pay the deposit.",
];

const Contact = () => {
  const [data, setData] = useState({ name: "", email: "", phone: "", course: "General question", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const siteSettings = usePublicSiteSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await sendContactEmail(data);

    if (result.success) {
      toast({
        title: "Message sent",
        description: "Admissions will reply soon by email or WhatsApp.",
      });
      setData({ name: "", email: "", phone: "", course: "General question", message: "" });
    } else {
      toast({
        title: "Message not sent",
        description: result.error || "Please try WhatsApp if the form does not work.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  const handleWhatsApp = () => {
    const message = getContactWhatsAppMessage(data);
    const whatsappUrl = `https://wa.me/${siteSettings.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <section className="bg-cream pt-32 pb-14 md:pt-40 md:pb-20">
        <div className="container-edit grid gap-10 lg:grid-cols-[1fr_380px] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-leaf">Contact admissions</p>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl md:text-7xl">
              Ask anything before you choose your training
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-ink-soft md:text-lg">
              Need help with course selection, dates, visa, accommodation, payment or airport pickup? Send one clear message and our team will guide you with practical next steps.
            </p>
          </div>

          <div className="rounded-lg border border-sand bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-leaf" />
              <div>
                <p className="font-bold text-warm-dark">No pressure admissions</p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  You can ask questions first. A seat is reserved only after availability is confirmed and deposit is paid.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream pb-20">
        <div className="container-edit grid gap-8 lg:grid-cols-[1fr_420px]">
          <form onSubmit={handleSubmit} className="rounded-lg border border-sand bg-white p-5 shadow-sm md:p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-warm-dark">Send a message</h2>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                Include your course, preferred month and any travel or payment questions. We usually reply within one business day.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name *">
                <Input required value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="mt-2 bg-cream" placeholder="Your name" />
              </Field>
              <Field label="Email *">
                <Input required type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} className="mt-2 bg-cream" placeholder="you@example.com" />
              </Field>
              <Field label="WhatsApp / phone">
                <Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} className="mt-2 bg-cream" placeholder="+62..." />
              </Field>
              <Field label="Topic">
                <select
                  value={data.course}
                  onChange={(e) => setData({ ...data, course: e.target.value })}
                  className="mt-2 h-10 w-full rounded-md border border-input bg-cream px-3 text-sm text-warm-dark outline-none focus:border-terra focus:ring-2 focus:ring-terra/15"
                >
                  {courseOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Message *" className="mt-5">
              <Textarea
                required
                rows={7}
                value={data.message}
                onChange={(e) => setData({ ...data, message: e.target.value })}
                className="mt-2 bg-cream"
                placeholder="Example: I am interested in the 200-hour course in July. Is shared accommodation included? Do I need a visa extension?"
              />
            </Field>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button type="submit" size="lg" disabled={isSubmitting} className="h-12 rounded-full bg-terra px-7 text-white hover:bg-terra-deep">
                {isSubmitting ? "Sending..." : <><Send className="mr-2 h-4 w-4" /> Send message</>}
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={handleWhatsApp} className="h-12 rounded-full border-leaf px-7 text-leaf hover:bg-leaf/10">
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp us
              </Button>
            </div>
          </form>

          <aside className="space-y-5">
            <ContactCard
              icon={<MessageCircle className="h-5 w-5" />}
              label="Fastest reply"
              title="WhatsApp admissions"
              text={`+${siteSettings.whatsappNumber}`}
              href={`https://wa.me/${siteSettings.whatsappNumber}`}
            />
            <ContactCard
              icon={<Mail className="h-5 w-5" />}
              label="Email"
              title={siteSettings.general.email}
              text="Course, payment and document questions"
              href={`mailto:${siteSettings.general.email}`}
            />
            <ContactCard
              icon={<Phone className="h-5 w-5" />}
              label="Phone"
              title={siteSettings.general.phone}
              text="Call during Bali business hours"
              href={`tel:${siteSettings.general.phone}`}
            />
            <div className="rounded-lg border border-sand bg-white p-5">
              <h3 className="text-lg font-bold text-warm-dark">What happens after you contact us?</h3>
              <ul className="mt-4 space-y-3">
                {contactSteps.map((step) => (
                  <li key={step} className="flex gap-3 text-sm leading-6 text-ink-soft">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-white py-20 md:py-24">
        <div className="container-edit grid gap-8 lg:grid-cols-[420px_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-leaf">Visit the school</p>
            <h2 className="mt-4 text-3xl font-bold text-warm-dark md:text-4xl">Find us in Ubud, Bali</h2>
            <p className="mt-4 leading-7 text-ink-soft">
              Bali YTTC is based in Ubud, surrounded by quiet nature, practice spaces and student accommodation. Ask admissions before visiting so the team can guide you properly.
            </p>

            <div className="mt-7 space-y-4 rounded-lg border border-sand bg-cream p-5">
              <InfoRow icon={<MapPin className="h-5 w-5" />} title="Address" text={siteSettings.general.address} />
              <InfoRow icon={<Clock className="h-5 w-5" />} title="Admissions hours" text="Monday to Saturday, 9:00-19:00 WITA" />
              <InfoRow icon={<CalendarDays className="h-5 w-5" />} title="Best time to ask" text="Contact 4-8 weeks before your preferred training date." />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-sand bg-sand shadow-sm">
            <iframe
              title="Bali YTTC location map"
              src={siteSettings.mapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[360px] w-full md:h-[460px]"
            />
            <div className="flex flex-col gap-3 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-soft">Open the map for directions, traffic and nearby landmarks.</p>
              <a href={siteSettings.mapsLinkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex justify-center rounded-full bg-warm-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-warm-mid">
                Get directions
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`block ${className}`}>
      <Label className="text-xs font-bold uppercase tracking-wide text-warm-mid">{label}</Label>
      {children}
    </div>
  );
}

function ContactCard({
  icon,
  label,
  title,
  text,
  href,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} className="block rounded-lg border border-sand bg-white p-5 transition hover:border-terra/40 hover:shadow-sm">
      <div className="flex gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-terra/10 text-terra">{icon}</span>
        <span>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-leaf">{label}</span>
          <span className="mt-1 block font-bold text-warm-dark">{title}</span>
          <span className="mt-1 block text-sm text-ink-soft">{text}</span>
        </span>
      </div>
    </a>
  );
}

function InfoRow({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-terra">{icon}</span>
      <div>
        <p className="font-semibold text-warm-dark">{title}</p>
        <p className="mt-1 text-sm leading-6 text-ink-soft">{text}</p>
      </div>
    </div>
  );
}

export default Contact;
