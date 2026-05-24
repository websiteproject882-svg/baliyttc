import { NextRequest } from "next/server";
import { StaffRole, StaffStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { TEACHERS as STATIC_TEACHERS } from "@/data/site";
import { jsonWithRequestId, logApiError } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const slugify = (value: string) =>
  value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const staticBySlug = new Map(STATIC_TEACHERS.map((teacher) => [slugify(teacher.name), teacher]));

export async function GET(request: NextRequest) {
  try {
    const [teachers, staffTeachers] = await Promise.all([
      prisma.teacher.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          role: true,
          credentials: true,
          bio: true,
          image: true,
          styles: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.staff.findMany({
        where: {
          role: StaffRole.TEACHER,
          status: StaffStatus.ACTIVE,
        },
        include: {
          user: {
            select: {
              displayName: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const mappedTeachers = teachers.map((teacher) => {
      const fallback = staticBySlug.get(teacher.slug) || staticBySlug.get(slugify(teacher.name));

      return {
        id: teacher.id,
        name: teacher.name,
        slug: teacher.slug,
        role: teacher.role || fallback?.role || "",
        credentials: teacher.credentials || fallback?.cred || "",
        bio: teacher.bio || fallback?.bio || "",
        image: teacher.image || fallback?.img || "/images/teachers/vivek-kalura.jpg",
        styles: teacher.styles?.length ? teacher.styles : fallback?.style || [],
        isActive: teacher.isActive,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
      };
    });

    const existingSlugs = new Set(mappedTeachers.map((teacher) => teacher.slug));
    const staffBackedTeachers = staffTeachers.flatMap((member) => {
      const name = member.user.displayName?.trim();
      if (!name) return [];

      const slug = slugify(name);
      if (existingSlugs.has(slug)) return [];

      const fallback = staticBySlug.get(slug);
      existingSlugs.add(slug);

      return [
        {
          id: `staff-${member.id}`,
          name,
          slug,
          role: "Teacher",
          credentials: fallback?.cred || "Bali YTTC teaching faculty",
          bio:
            fallback?.bio ||
            `${name} is part of the Bali YTTC teaching team, supporting students through practice, methodology and daily training.`,
          image: fallback?.img || "/images/teachers/vivek-kalura.jpg",
          styles: fallback?.style || ["Teaching Methodology", "Practice Support"],
          isActive: true,
          createdAt: member.createdAt,
          updatedAt: member.createdAt,
          source: "staff",
        },
      ];
    });

    return jsonWithRequestId({
      teachers: [...mappedTeachers, ...staffBackedTeachers],
    }, undefined, request);
  } catch (error) {
    logApiError("teachers.public", error, request);
    return jsonWithRequestId({
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
    }, undefined, request);
  }
}
