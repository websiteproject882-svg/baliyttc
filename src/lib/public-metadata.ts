import type { Metadata } from "next";
import { getPublicBaseUrl } from "@/lib/public-url";

const baseUrl = getPublicBaseUrl();
const defaultImage = `${baseUrl}/images/brand/logo-512.png`;

export type PublicMetadataKey =
  | "home"
  | "courses"
  | "about"
  | "instructors"
  | "activities"
  | "gallery"
  | "testimonials"
  | "videos"
  | "yogaAlliance"
  | "contact"
  | "pricing"
  | "apply"
  | "schedule"
  | "faq"
  | "accommodation"
  | "visa"
  | "retreats"
  | "workshops"
  | "terms"
  | "blog";

const publicMetadata: Record<PublicMetadataKey, { title: string; description: string; keywords: string[] }> = {
  home: {
    title: "Yoga Teacher Training in Bali | Bali YTTC",
    description:
      "Join Yoga Alliance certified yoga teacher training in Ubud, Bali with small batches, expert teachers, villa stay, meals and 2026 dates.",
    keywords: ["yoga teacher training bali", "Bali YTTC", "Ubud yoga school"],
  },
  courses: {
    title: "Yoga Teacher Training Courses in Bali | Bali YTTC",
    description:
      "Compare 50hr, 100hr, 200hr and 300hr yoga teacher training in Ubud, Bali with clear durations, prices, dates and certification paths.",
    keywords: ["yoga teacher training courses bali", "200 hour ytt bali", "100 hour ytt bali"],
  },
  about: {
    title: "About Bali YTTC Yoga School Ubud | Bali YTTC",
    description:
      "Meet Bali YTTC, an Ubud yoga school founded in 2018 with 2,500+ graduates, small groups and Yoga Alliance certified training.",
    keywords: ["about bali yttc yoga school ubud", "Bali yoga school", "Ubud yoga teacher training"],
  },
  instructors: {
    title: "Yoga Teachers Bali YTTC | Bali YTTC",
    description:
      "Meet Bali YTTC teachers in Ubud, Bali with 10-15+ years of experience across Hatha, Ashtanga, Vinyasa, philosophy and sound healing.",
    keywords: ["yoga teachers bali yttc", "Bali yoga instructors", "Ubud yoga teachers"],
  },
  activities: {
    title: "Yoga Teacher Training Activities Bali | Bali YTTC",
    description:
      "Explore Bali YTTC activities in Ubud, Bali including temple purification, acro yoga, sound healing, beach practice and cultural immersion.",
    keywords: ["yoga teacher training activities bali", "Bali YTTC activities", "Ubud yoga activities"],
  },
  gallery: {
    title: "Bali YTTC Gallery Ubud Campus | Bali YTTC",
    description:
      "View Bali YTTC photos from Ubud, Bali including yoga shala, villas, ceremonies, meals, training moments, excursions and student life.",
    keywords: ["Bali YTTC gallery", "Ubud yoga school photos", "Bali yoga teacher training photos"],
  },
  testimonials: {
    title: "Bali YTTC Reviews Testimonials | Bali YTTC",
    description:
      "Read Bali YTTC reviews from students who completed 50hr, 100hr and 200hr yoga teacher training in Ubud, Bali.",
    keywords: ["bali yttc reviews testimonials", "Bali YTTC reviews", "yoga teacher training Bali testimonials"],
  },
  videos: {
    title: "Bali YTTC Student Videos | Bali YTTC",
    description:
      "Watch Bali YTTC videos showing Ubud training life, yoga classes, teacher guidance, student reviews, ceremonies and campus moments.",
    keywords: ["Bali YTTC videos", "yoga teacher training Bali videos", "Ubud yoga school videos"],
  },
  yogaAlliance: {
    title: "Yoga Alliance Certified School Bali | Bali YTTC",
    description:
      "Learn how Bali YTTC supports Yoga Alliance certified training in Ubud, Bali for 200hr and advanced teacher training pathways.",
    keywords: ["yoga alliance certified school bali", "Yoga Alliance Bali", "RYT 200 Bali"],
  },
  contact: {
    title: "Contact Bali Yoga Teacher Training | Bali YTTC",
    description:
      "Contact Bali YTTC in Ubud, Bali for 2026 yoga teacher training dates, course fees, accommodation, visa questions and applications.",
    keywords: ["contact bali yoga teacher training", "Bali YTTC contact", "Ubud yoga school contact"],
  },
  pricing: {
    title: "Yoga Teacher Training Pricing Bali | Bali YTTC",
    description:
      "See Bali YTTC course fees in Ubud, Bali: 50hr from EUR 399, 100hr EUR 699, 200hr EUR 1,499 and 300hr EUR 1,899.",
    keywords: ["yoga teacher training pricing bali", "Bali YTTC fees", "200 hour YTT Bali price"],
  },
  apply: {
    title: "Apply for Yoga Teacher Training Bali | Bali YTTC",
    description:
      "Apply for Bali YTTC 2026 training in Ubud, Bali. Choose 50hr, 100hr, 200hr or 300hr dates and secure your seat with admissions.",
    keywords: ["apply yoga teacher training bali", "Bali YTTC application", "2026 yoga training Bali"],
  },
  schedule: {
    title: "Yoga Teacher Training Schedule Bali | Bali YTTC",
    description:
      "View 2026 Bali YTTC start dates in Ubud, Bali for 50hr, 100hr, 200hr and 300hr yoga teacher training with prices and seats.",
    keywords: ["yoga teacher training schedule bali", "Bali YTTC dates", "200 hour YTT Bali dates"],
  },
  faq: {
    title: "Bali Yoga Teacher Training FAQ | Bali YTTC",
    description:
      "Get answers about Bali YTTC training in Ubud, Bali including certification, accommodation, meals, visas, payment and graduation.",
    keywords: ["Bali yoga teacher training FAQ", "Bali YTTC questions", "Ubud yoga school FAQ"],
  },
  accommodation: {
    title: "Yoga Training Accommodation Ubud Bali | Bali YTTC",
    description:
      "See Bali YTTC accommodation in Ubud, Bali with shared and private villa rooms, pool, shala, WiFi, meals and campus amenities.",
    keywords: ["yoga training accommodation bali", "Bali YTTC accommodation", "Ubud yoga school villa"],
  },
  visa: {
    title: "Bali Visa Guide for Yoga Students | Bali YTTC",
    description:
      "Plan your yoga teacher training visa for Ubud, Bali with VOA and B211A guidance, airport details, stay length and travel preparation.",
    keywords: ["Bali visa yoga teacher training", "B211A Bali yoga", "VOA Bali training"],
  },
  retreats: {
    title: "Yoga Retreats in Bali Ubud | Bali YTTC",
    description:
      "Join Bali YTTC yoga retreats in Ubud, Bali with daily practice, meditation, ceremonies, plant-based meals and calm campus living.",
    keywords: ["yoga retreats bali ubud", "Bali yoga retreat", "Ubud yoga retreat"],
  },
  workshops: {
    title: "Yoga Workshops in Bali | Bali YTTC",
    description:
      "Book Bali YTTC workshops in Ubud, Bali including sound healing, acro yoga, arm balancing, mandala art and yoga practice labs.",
    keywords: ["yoga workshops bali", "sound healing Bali", "acro yoga Bali"],
  },
  terms: {
    title: "Terms and Policy | Bali YTTC",
    description:
      "Review Bali YTTC terms, policies, booking conditions, cancellation guidance and student responsibilities for training in Ubud, Bali.",
    keywords: ["Bali YTTC terms", "Bali YTTC policy", "yoga training cancellation policy"],
  },
  blog: {
    title: "Bali Yoga Teacher Training Blog | Bali YTTC",
    description:
      "Read Bali YTTC guides on yoga teacher training, Yoga Alliance, Ubud student life, practice tips, philosophy and Bali preparation.",
    keywords: ["Bali yoga teacher training blog", "Yoga Alliance guide", "Ubud yoga blog"],
  },
};

export function createPublicMetadata(key: PublicMetadataKey, locale: string, path = ""): Metadata {
  const item = publicMetadata[key];
  const normalizedPath = path === "/" ? "" : path;
  const url = `${baseUrl}/${locale}${normalizedPath}`;

  return {
    title: item.title,
    description: item.description,
    keywords: item.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: item.title,
      description: item.description,
      url,
      siteName: "Bali YTTC",
      type: "website",
      images: [
        {
          url: defaultImage,
          width: 512,
          height: 512,
          alt: "Bali YTTC",
        },
      ],
    },
  };
}
