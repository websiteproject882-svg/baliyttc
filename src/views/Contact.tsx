import { useState } from "react";
import { SITE } from "@/data/site";
import { LocationMap } from "@/components/home/LocationMap";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Phone, Mail, Loader2, MessageCircle, Clock } from "lucide-react";
import { sendContactEmail, getContactWhatsAppMessage } from "@/lib/emailjs";

const Contact = () => {
  const [data, setData] = useState({ name: "", email: "", course: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const site = SITE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await sendContactEmail(data);

    if (result.success) {
      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      });
      setData({ name: "", email: "", course: "", message: "" });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  const handleWhatsApp = () => {
    const message = getContactWhatsAppMessage(data);
    const whatsappUrl = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <>
      <section className="pt-40 pb-16 bg-cream">
        <div className="container-edit">
          <SectionHeading
            eyebrow="Get in touch"
            title={<>We'd love to <em className="text-terra">hear from you</em></>}
            sub="Send a message to our admissions team. We usually reply within an hour."
          />
        </div>
      </section>

      <section className="pb-24 bg-cream">
        <div className="container-edit grid lg:grid-cols-12 gap-10">
          <Reveal className="lg:col-span-7">
            <form
              onSubmit={handleSubmit}
              className="bg-sand p-8 md:p-10 rounded-lg space-y-5"
            >
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <Label className="text-warm-mid text-xs uppercase tracking-wider">Name</Label>
                  <Input required value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className="mt-1.5 bg-cream" />
                </div>
                <div>
                  <Label className="text-warm-mid text-xs uppercase tracking-wider">Email</Label>
                  <Input required type="email" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} className="mt-1.5 bg-cream" />
                </div>
              </div>
              <div>
                <Label className="text-warm-mid text-xs uppercase tracking-wider">Interested course</Label>
                <Input value={data.course} onChange={(e) => setData({ ...data, course: e.target.value })} placeholder="e.g. 200-Hour YTT, March 2026" className="mt-1.5 bg-cream" />
              </div>
              <div>
                <Label className="text-warm-mid text-xs uppercase tracking-wider">Your message</Label>
                <Textarea required rows={6} value={data.message} onChange={(e) => setData({ ...data, message: e.target.value })} className="mt-1.5 bg-cream" />
              </div>
              <Button type="submit" size="lg" disabled={isSubmitting} className="bg-terra hover:bg-terra-deep text-cream h-12 w-full sm:w-auto px-8">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </Reveal>

          <Reveal className="lg:col-span-5 space-y-6" delay={0.2}>
            <div className="bg-sand p-8 rounded-lg space-y-6">
              <div>
                <h3 className="font-serif text-2xl text-warm-dark mb-4">Or reach us directly</h3>
                <div className="space-y-4">
                  <a href={`tel:${site.phone}`} className="flex items-center gap-4 group">
                    <div className="p-3 bg-terra/10 rounded-lg group-hover:bg-terra/20 transition-colors">
                      <Phone className="w-5 h-5 text-terra" />
                    </div>
                    <div>
                      <p className="font-bold text-warm-dark">{site.phone}</p>
                      <p className="text-sm text-warm-mid">Call us anytime</p>
                    </div>
                  </a>
                  <a href={`mailto:${site.email}`} className="flex items-center gap-4 group">
                    <div className="p-3 bg-terra/10 rounded-lg group-hover:bg-terra/20 transition-colors">
                      <Mail className="w-5 h-5 text-terra" />
                    </div>
                    <div>
                      <p className="font-bold text-warm-dark">{site.email}</p>
                      <p className="text-sm text-warm-mid">Email us anytime</p>
                    </div>
                  </a>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-warm-dark">Mon-Sat / 9am-7pm WITA</p>
                      <p className="text-sm text-warm-mid">Indonesia Time (UTC+8)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Button */}
              <div className="pt-4 border-t border-warm-light/20">
                <p className="text-sm text-warm-mid mb-3">Prefer WhatsApp? Chat with us instantly!</p>
                <Button
                  type="button"
                  onClick={handleWhatsApp}
                  className="w-full bg-green-500 hover:bg-green-600 text-white h-12"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat on WhatsApp
                </Button>
              </div>
            </div>

            <LocationMap />
          </Reveal>
        </div>
      </section>
    </>
  );
};

export default Contact;
