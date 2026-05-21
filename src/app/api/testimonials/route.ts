import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "6", 10), 20);

    const [testimonials, aggregates] = await Promise.all([
      prisma.testimonial.findMany({
        where: { status: "APPROVED" },
        include: {
          student: {
            include: {
              user: {
                select: {
                  displayName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
      }),
      prisma.testimonial.aggregate({
        where: { status: "APPROVED" },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      testimonials: testimonials.map((item) => ({
        id: item.id,
        name: item.student.user.displayName || item.student.user.email,
        course: item.courseName || item.student.enrolledCourse || "Graduate",
        quote: item.quote,
        rating: item.rating,
        location: item.location,
        graduationYear: item.graduationYear,
      })),
      stats: {
        averageRating: Number((aggregates._avg.rating || 0).toFixed(1)),
        totalApproved: aggregates._count.id || 0,
      },
    });
  } catch (error) {
    console.error("GET public testimonials error:", error);
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}
