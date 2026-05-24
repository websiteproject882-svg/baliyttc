import { NextLayoutWrapper } from "@/components/layout/NextLayoutWrapper";
import TestimonialsPage, { type PublicTestimonial } from "@/views/TestimonialsPage";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getInitialTestimonials(): Promise<PublicTestimonial[]> {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { status: "APPROVED" },
      select: {
        id: true,
        courseName: true,
        quote: true,
        rating: true,
        location: true,
        graduationYear: true,
        student: {
          select: {
            enrolledCourse: true,
            user: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
      take: 12,
    });

    return testimonials.map((item) => ({
      id: item.id,
      name: item.student.user.displayName || "Bali YTTC Graduate",
      course: item.courseName || item.student.enrolledCourse || "Graduate",
      quote: item.quote,
      rating: item.rating,
      location: item.location,
      graduationYear: item.graduationYear,
    }));
  } catch {
    return [];
  }
}

export default async function Page() {
  const testimonials = await getInitialTestimonials();

  return (
    <NextLayoutWrapper>
      <TestimonialsPage initialTestimonials={testimonials} />
    </NextLayoutWrapper>
  );
}
