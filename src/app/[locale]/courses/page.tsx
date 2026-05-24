import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { ApplyModal } from "@/components/shared/ApplyModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Users, Award } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { createPublicMetadata } from "@/lib/public-metadata";

export function generateMetadata({ params }: { params: { locale: string } }) {
  return createPublicMetadata("courses", params.locale, "/courses");
}

async function getCourses(locale: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/courses?locale=${encodeURIComponent(locale)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.courses;
  } catch {
    return null;
  }
}

export default async function CoursesPage({ params }: { params: { locale: string } }) {
  const courses = await getCourses(params.locale);
  const t = await getTranslations({ locale: params.locale, namespace: "CoursesPage" });

  return (
    <NextLayoutWrapper>
      <div className="pt-40 pb-24 bg-cream min-h-screen">
        <div className="container-wide">
          <Reveal>
            <SectionHeading
              eyebrow={t("eyebrow")}
              title={<>{t("titlePrefix")} <em className="text-terra">{t("titleAccent")}</em></>}
              sub={t("subtitle")}
            />
          </Reveal>

          {courses && courses.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              {courses.map((course: any, i: number) => (
                <Reveal key={course.id} delay={i * 0.1}>
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <img
                        src={course.image || "/placeholder.jpg"}
                        alt={course.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 text-warm-dark shadow-sm">
                          {course.duration}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="display-sm mb-2 text-warm-dark">
                        {course.name}
                      </h3>
                      <p className="text-warm-mid text-sm mb-4 line-clamp-2 flex-1">
                        {course.summary}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-warm-mid mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {t("yogaAlliance")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-warm-light/20">
                        <div>
                          <p className="price-label">{t("startingFrom")}</p>
                          <p className="price-value text-warm-dark">EUR {course.priceFrom}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/courses/${course.slug}`}>
                            <Button variant="outline" size="sm">{t("details")}</Button>
                          </Link>
                          <ApplyModal
                            trigger={
                              <Button size="sm" className="bg-terra hover:bg-terra-deep text-cream">
                                {t("applyNow")}
                              </Button>
                            }
                            defaultCourse={course.slug}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-warm-mid">{t("loading")}</p>
            </div>
          )}

          {/* CTA */}
          <Reveal delay={0.3}>
            <div className="mt-16 bg-gradient-to-r from-terra to-terra-deep rounded-2xl p-8 md:p-12 text-center text-white">
              <h3 className="display-md mb-4">
                {t("ctaTitle")}
              </h3>
              <p className="text-white/80 mb-6 max-w-2xl mx-auto">
                {t("ctaSubtitle")}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/contact">
                  <Button size="lg" variant="secondary" className="bg-white text-terra hover:bg-white/90">
                    {t("contactUs")} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <ApplyModal
                  trigger={
                    <Button size="lg" className="bg-terra-deep hover:bg-terra text-white border-0">
                      {t("applyNow")}
                    </Button>
                  }
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </NextLayoutWrapper>
  );
}
