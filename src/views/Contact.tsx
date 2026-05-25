import { useState } from "react";
import type { ReactNode } from "react";
import { useLocale } from "next-intl";
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
import { getPageCopy } from "@/lib/page-i18n";

const Contact = () => {
  const locale = useLocale();
  const copy = getPageCopy(locale, "contact");
  const [data, setData] = useState({ name: "", email: "", phone: "", course: "General question", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const siteSettings = usePublicSiteSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await sendContactEmail(data);

    if (result.success) {
      toast({
        title: copy.successTitle,
        description: copy.successDesc,
      });
      setData({ name: "", email: "", phone: "", course: copy.courseOptions[0], message: "" });
    } else {
      toast({
        title: copy.errorTitle,
        description: result.error || copy.errorDesc,
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
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-leaf">{copy.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl font-bold leading-tight text-warm-dark sm:text-5xl md:text-7xl">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-ink-soft md:text-lg">
              {copy.intro}
            </p>
          </div>

          <div className="rounded-lg border border-sand bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-leaf" />
              <div>
                <p className="font-bold text-warm-dark">{copy.trustTitle}</p>
                <p className="mt-1 text-sm leading-6 text-ink-soft">
                  {copy.trustText}
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
              <h2 className="text-2xl font-bold text-warm-dark">{copy.formTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-soft">
                {copy.formText}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={copy.fullName}>
                <Input required value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="mt-2 bg-cream" placeholder={copy.namePlaceholder} />
              </Field>
              <Field label={copy.email}>
                <Input required type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} className="mt-2 bg-cream" placeholder={copy.emailPlaceholder} />
              </Field>
              <Field label={copy.phone}>
                <Input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} className="mt-2 bg-cream" placeholder={copy.phonePlaceholder} />
              </Field>
              <Field label={copy.topic}>
                <select
                  value={copy.courseOptions.includes(data.course) ? data.course : copy.courseOptions[0]}
                  onChange={(e) => setData({ ...data, course: e.target.value })}
                  className="mt-2 h-10 w-full rounded-md border border-input bg-cream px-3 text-sm text-warm-dark outline-none focus:border-terra focus:ring-2 focus:ring-terra/15"
                >
                  {copy.courseOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label={copy.message} className="mt-5">
              <Textarea
                required
                rows={7}
                value={data.message}
                onChange={(e) => setData({ ...data, message: e.target.value })}
                className="mt-2 bg-cream"
                placeholder={copy.messagePlaceholder}
              />
            </Field>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button type="submit" size="lg" disabled={isSubmitting} className="h-12 rounded-full bg-terra px-7 text-white hover:bg-terra-deep">
                {isSubmitting ? copy.sending : <><Send className="mr-2 h-4 w-4" /> {copy.send}</>}
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={handleWhatsApp} className="h-12 rounded-full border-leaf px-7 text-leaf hover:bg-leaf/10">
                <MessageCircle className="mr-2 h-4 w-4" /> {copy.whatsapp}
              </Button>
            </div>
          </form>

          <aside className="space-y-5">
            <ContactCard
              icon={<MessageCircle className="h-5 w-5" />}
              label={copy.fastestReply}
              title={copy.whatsappAdmissions}
              text={`+${siteSettings.whatsappNumber}`}
              href={`https://wa.me/${siteSettings.whatsappNumber}`}
            />
            <ContactCard
              icon={<Mail className="h-5 w-5" />}
              label={copy.emailLabel}
              title={siteSettings.general.email}
              text={copy.emailText}
              href={`mailto:${siteSettings.general.email}`}
            />
            <ContactCard
              icon={<Phone className="h-5 w-5" />}
              label={copy.phoneLabel}
              title={siteSettings.general.phone}
              text={copy.phoneText}
              href={`tel:${siteSettings.general.phone}`}
            />
            <div className="rounded-lg border border-sand bg-white p-5">
              <h3 className="text-lg font-bold text-warm-dark">{copy.nextTitle}</h3>
              <ul className="mt-4 space-y-3">
                {copy.steps.map((step) => (
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
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-leaf">{copy.visitEyebrow}</p>
            <h2 className="mt-4 text-3xl font-bold text-warm-dark md:text-4xl">{copy.visitTitle}</h2>
            <p className="mt-4 leading-7 text-ink-soft">
              {copy.visitText}
            </p>

            <div className="mt-7 space-y-4 rounded-lg border border-sand bg-cream p-5">
              <InfoRow icon={<MapPin className="h-5 w-5" />} title={copy.address} text={siteSettings.general.address} />
              <InfoRow icon={<Clock className="h-5 w-5" />} title={copy.hours} text={copy.hoursText} />
              <InfoRow icon={<CalendarDays className="h-5 w-5" />} title={copy.bestTime} text={copy.bestTimeText} />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-sand bg-sand shadow-sm">
            <iframe
              title={copy.mapTitle}
              src={siteSettings.mapsEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[360px] w-full md:h-[460px]"
            />
            <div className="flex flex-col gap-3 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-soft">{copy.mapText}</p>
              <a href={siteSettings.mapsLinkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex justify-center rounded-full bg-warm-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-warm-mid">
                {copy.directions}
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
