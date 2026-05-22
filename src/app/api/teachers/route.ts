import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TEACHERS as STATIC_TEACHERS } from "@/data/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const slugify = (value: string) =>
  value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const staticBySlug = new Map(STATIC_TEACHERS.map((teacher) => [slugify(teacher.name), teacher]));

export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      teachers: teachers.map((teacher) => {
        const fallback = staticBySlug.get(teacher.slug) || staticBySlug.get(slugify(teacher.name));

        return {
          ...teacher,
          role: teacher.role || fallback?.role || "",
          credentials: teacher.credentials || fallback?.cred || "",
          bio: teacher.bio || fallback?.bio || "",
          image: teacher.image || fallback?.img || "/images/teachers/vivek-kalura.jpg",
          styles: teacher.styles?.length ? teacher.styles : fallback?.style || [],
        };
      }),
    });
  } catch (error) {
    console.error("GET teachers error:", error);
    return NextResponse.json({
      teachers: STATIC_TEACHERS.map((teacher, index) => ({
        id: `static-teacher-${index + 1}`,
        name: teacher.name,
        slug: slugify(teacher.name),
        role: teacher.role,
        credentials: teacher.cred,
        bio: teacher.bio,
        image: teacher.img,
        styles: teacher.style,
        isActive: true,
      })),
      fallback: true,
    });
  }
}
