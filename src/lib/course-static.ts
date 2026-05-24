import { COURSES } from "@/data/site";

export const courseSlugs = ["50hr", "100hr", "200hr", "300hr"] as const;
export type CourseSlug = (typeof courseSlugs)[number];

type StaticCourseSource = (typeof COURSES)[number];

export type StaticCoursePageData = {
  id: string;
  slug: CourseSlug;
  name: string;
  duration: string;
  summary: string;
  description: string;
  priceFrom: number;
  priceFull?: number;
  image: string;
  modules: { title: string; description: string; hours: number }[];
  batches: { id: string; name: string; startDate: string; priceRegular: number; enrolled: number; capacity: number }[];
};

export const courseSeo: Record<CourseSlug, { title: string; description: string; keyword: string }> = {
  "50hr": {
    keyword: "50 hour hatha vinyasa yoga training bali",
    title: "50 Hour Hatha Vinyasa Yoga Training Bali | Bali YTTC",
    description:
      "Join a 6-day 50 hour Hatha Vinyasa yoga training in Ubud, Bali from EUR 399 with alignment, breathwork and beginner teaching practice.",
  },
  "100hr": {
    keyword: "100 hour yoga teacher training bali",
    title: "100 Hour Yoga Teacher Training Bali | Bali YTTC",
    description:
      "Start an 11-day 100 hour yoga teacher training in Ubud, Bali from EUR 699 with Hatha, Ashtanga, Vinyasa and guided teaching basics.",
  },
  "200hr": {
    keyword: "200 hour yoga teacher training bali",
    title: "200 Hour Yoga Teacher Training Bali | Bali YTTC",
    description:
      "Become Yoga Alliance certified in 21 days with 200 hour yoga teacher training in Ubud, Bali from EUR 1,499 including meals and practice.",
  },
  "300hr": {
    keyword: "300 hour advanced yoga teacher training bali",
    title: "300 Hour Advanced Yoga Teacher Training Bali | Bali YTTC",
    description:
      "Advance your teaching with a 28-day 300 hour advanced yoga teacher training in Ubud, Bali from EUR 1,899 for 200hr graduates.",
  },
};

const batchDates: Record<CourseSlug, Array<{ startDate: string; label: string; enrolled: number; capacity: number }>> = {
  "50hr": [
    { startDate: "2026-06-05T00:00:00.000Z", label: "June 2026 Short Course", enrolled: 4, capacity: 12 },
    { startDate: "2026-07-05T00:00:00.000Z", label: "July 2026 Short Course", enrolled: 3, capacity: 12 },
  ],
  "100hr": [
    { startDate: "2026-06-10T00:00:00.000Z", label: "June 2026 Foundation", enrolled: 5, capacity: 14 },
    { startDate: "2026-07-15T00:00:00.000Z", label: "July 2026 Foundation", enrolled: 2, capacity: 14 },
    { startDate: "2026-08-19T00:00:00.000Z", label: "August 2026 Foundation", enrolled: 1, capacity: 14 },
  ],
  "200hr": [
    { startDate: "2026-06-03T00:00:00.000Z", label: "June 2026 Main Batch", enrolled: 8, capacity: 12 },
    { startDate: "2026-07-08T00:00:00.000Z", label: "July 2026 Main Batch", enrolled: 3, capacity: 12 },
    { startDate: "2026-08-12T00:00:00.000Z", label: "August 2026 Main Batch", enrolled: 1, capacity: 12 },
  ],
  "300hr": [
    { startDate: "2026-07-01T00:00:00.000Z", label: "July 2026 Advanced", enrolled: 2, capacity: 12 },
    { startDate: "2026-09-02T00:00:00.000Z", label: "September 2026 Advanced", enrolled: 1, capacity: 12 },
  ],
};

function isCourseSlug(slug: string): slug is CourseSlug {
  return courseSlugs.includes(slug as CourseSlug);
}

function getSourceCourse(slug: CourseSlug): StaticCourseSource {
  const course = COURSES.find((item) => item.slug === slug);
  if (!course) {
    throw new Error(`Missing static course data for ${slug}`);
  }
  return course;
}

export function getStaticCourse(slug: string): StaticCoursePageData | null {
  if (!isCourseSlug(slug)) return null;

  const course = getSourceCourse(slug);
  return {
    id: `static-course-${course.slug}`,
    slug,
    name: course.title,
    duration: course.days,
    summary: course.summary,
    description: course.summary,
    priceFrom: course.priceFrom,
    priceFull: course.priceFrom,
    image: course.image,
    modules: course.modules.map((module, index) => ({
      title: module.title,
      description: module.desc,
      hours: index === 0 ? 25 : 15,
    })),
    batches: batchDates[slug].map((batch, index) => ({
      id: `static-batch-${slug}-${index + 1}`,
      name: batch.label,
      startDate: batch.startDate,
      priceRegular: course.priceFrom,
      enrolled: batch.enrolled,
      capacity: batch.capacity,
    })),
  };
}
