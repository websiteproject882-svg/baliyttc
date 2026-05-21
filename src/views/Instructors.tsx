import { useState, useEffect } from "react";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Loader2 } from "lucide-react";

interface Teacher {
  id: string;
  name: string;
  slug: string;
  role: string;
  credentials: string;
  bio: string;
  image: string;
  styles: string[];
}

const Instructors = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/teachers");
      const data = await res.json();
      setTeachers(data.teachers || []);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-terra" />
      </div>
    );
  }

  return (
    <>
      <section className="pt-40 pb-16 bg-cream">
        <div className="container-edit">
          <SectionHeading
            eyebrow="Meet your teachers"
            title={<>Guides who have <em className="text-terra">walked the path</em></>}
            sub="A circle of senior teachers, each bringing decades of practice and a unique lineage to your training."
          />
        </div>
      </section>

      <section className="pb-28 bg-cream">
        <div className="container-edit grid md:grid-cols-2 gap-14 lg:gap-20">
          {teachers.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08}>
              <article>
                <div className="aspect-[4/5] rounded-md overflow-hidden bg-sand/20">
                  <img src={t.image || "/placeholder-teacher.jpg"} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <p className="mt-6 text-[10px] tracking-[0.28em] uppercase text-terra">{t.role} · {t.credentials}</p>
                <h2 className="font-serif text-3xl text-warm-dark mt-2">{t.name}</h2>
                <p className="mt-4 text-ink-soft leading-relaxed">{t.bio}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {t.styles.map((s) => (
                    <span key={s} className="text-[10px] uppercase tracking-wider px-3 py-1 bg-sand text-warm-mid rounded-full">{s}</span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
};

export default Instructors;
