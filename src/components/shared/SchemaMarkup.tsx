import { COURSES, SITE } from "@/data/site";
import type { SiteSettings } from "@/lib/site-settings";

const publicBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://baliyttc.com").replace(/\/$/, "");
const defaultLogoUrl = `${publicBaseUrl}/images/brand/logo-512.png`;

type CourseSchemaData = {
  slug: string;
  name?: string;
  title?: string;
  summary: string;
  duration?: string;
  days?: string;
  priceFrom: number;
  image?: string;
  next?: string;
  seats?: string;
};

function absoluteUrl(value?: string | null) {
  if (!value) return defaultLogoUrl;
  if (value.startsWith("http")) return value;
  return `${publicBaseUrl}${value.startsWith("/") ? "" : "/"}${value}`;
}

function schemaSettings(settings?: SiteSettings) {
  return {
    name: settings?.general.schoolName || SITE.name,
    description: settings?.general.tagline || SITE.philosophy,
    phone: settings?.general.phone || SITE.phone,
    email: settings?.general.email || SITE.email,
    address: settings?.general.address || "Ubud, Gianyar Regency, Bali 80571, Indonesia",
    logoUrl: absoluteUrl(settings?.assets.logoUrl),
  };
}

// Organization Schema
export const OrganizationSchema = ({ settings }: { settings?: SiteSettings }) => {
  const data = schemaSettings(settings);

  return (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: data.name,
        description: data.description,
        url: publicBaseUrl,
        logo: data.logoUrl,
        image: data.logoUrl,
        telephone: data.phone,
        email: data.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: data.address,
          addressLocality: "Ubud",
          addressRegion: "Bali",
          postalCode: "80571",
          addressCountry: "ID",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: "-8.5069",
          longitude: "115.2625",
        },
        sameAs: [
          "https://www.instagram.com/baliyttc",
          "https://www.facebook.com/baliyttc",
          "https://www.youtube.com/@baliyttc",
        ],
        foundingDate: "2018",
        areaServed: {
          "@type": "Place",
          name: "Ubud, Bali, Indonesia",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Yoga Teacher Training Programs",
          itemListElement: COURSES.map((course) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Course",
              name: course.title,
              description: course.summary,
              provider: {
                "@type": "Organization",
                name: data.name,
              },
            },
            price: course.priceFrom,
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            validFrom: course.next,
          })),
        },
      }),
    }}
  />
  );
};

// Course Schema for each course page
export const CourseSchema = ({ course, locale = "en" }: { course: CourseSchemaData; locale?: string }) => {
  const courseName = course.name || course.title || "Yoga Teacher Training";
  const durationText = course.duration || course.days || "";
  const courseUrl = `${publicBaseUrl}/${locale}/courses/${course.slug}`;

  return (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Course",
        name: courseName,
        description: course.summary,
        image: course.image?.startsWith("http") ? course.image : course.image ? `${publicBaseUrl}${course.image}` : defaultLogoUrl,
        url: courseUrl,
        provider: {
          "@type": "Organization",
          name: SITE.name,
          url: publicBaseUrl,
        },
        offers: {
          "@type": "Offer",
          price: course.priceFrom,
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: courseUrl,
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          name: `Upcoming ${courseName}`,
          startDate: course.next,
          courseMode: "Onsite",
          courseWorkload: durationText,
          location: {
            "@type": "Place",
            name: `${SITE.name} - Ubud, Bali`,
            address: {
              "@type": "PostalAddress",
              addressLocality: "Ubud",
              addressRegion: "Bali",
              addressCountry: "ID",
            },
          },
          offers: {
            "@type": "Offer",
            price: course.priceFrom,
            priceCurrency: "EUR",
            availability: course.seats?.includes("4 seats")
              ? "https://schema.org/LimitedAvailability"
              : "https://schema.org/InStock",
          },
        },
        educationalLevel: course.slug === "50hr" || course.slug === "100hr" ? "Beginner" : course.slug === "200hr" ? "Intermediate" : "Advanced",
        coursePrerequisites: course.slug === "300hr" ? "200-hour Yoga Alliance certification" : "None",
        educationalCredentialAwarded: `${courseName} - Yoga Alliance RYT-${course.slug.replace("hr", "")}`,
        numberOfCredits: {
          "@type": "StructuredValue",
          value: Number.parseInt(course.slug.replace("hr", ""), 10),
          unitCode: "HUR",
        },
      }),
    }}
  />
  );
};

// FAQ Schema
export const FAQSchema = ({ faqs }: { faqs: Array<{ q: string; a: string }> }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      }),
    }}
  />
);

// Breadcrumb Schema
export const BreadcrumbSchema = ({ items }: { items: Array<{ name: string; url: string }> }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }),
    }}
  />
);

// Local Business Schema
export const LocalBusinessSchema = ({ settings }: { settings?: SiteSettings }) => {
  const data = schemaSettings(settings);

  return (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": `${publicBaseUrl}/#organization`,
        name: data.name,
        url: publicBaseUrl,
        telephone: data.phone,
        email: data.email,
        image: data.logoUrl,
        logo: data.logoUrl,
        priceRange: "EUR 499-1899",
        servesCuisine: "Vegetarian",
        address: {
          "@type": "PostalAddress",
          streetAddress: data.address,
          addressLocality: "Ubud",
          addressRegion: "Bali",
          postalCode: "80571",
          addressCountry: "ID",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "2500",
          bestRating: "5",
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            opens: "06:00",
            closes: "21:00",
          },
        ],
      }),
    }}
  />
  );
};
