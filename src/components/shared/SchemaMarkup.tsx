"use client";

import { SITE } from "@/data/site";
import { COURSES } from "@/data/site";

// Organization Schema
export const OrganizationSchema = () => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE.name,
        description: SITE.philosophy,
        url: "https://baliyttc.com",
        logo: "https://baliyttc.com/logo.png",
        image: "https://baliyttc.com/images/hero/bali-hero-bg.png",
        telephone: SITE.phone,
        email: SITE.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: "Ubud, Gianyar Regency",
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
          "https://www.youtube.com/baliyttc",
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
                name: SITE.name,
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

// Course Schema for each course page
export const CourseSchema = ({ course }: { course: typeof COURSES[0] }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Course",
        name: course.title,
        description: course.summary,
        provider: {
          "@type": "Organization",
          name: SITE.name,
          url: "https://baliyttc.com",
        },
        offers: {
          "@type": "Offer",
          price: course.priceFrom,
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url: `https://baliyttc.com/courses/${course.slug}`,
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          name: `Upcoming ${course.title}`,
          startDate: course.next,
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
            availability: course.seats.includes("4 seats") 
              ? "https://schema.org/LimitedAvailability"
              : "https://schema.org/InStock",
          },
        },
        educationalLevel: course.slug === "100hr" 
          ? "Beginner" 
          : course.slug === "200hr" 
            ? "Intermediate" 
            : "Advanced",
        coursePrerequisites: course.slug === "300hr" 
          ? "200-hour Yoga Alliance certification" 
          : "None",
        educationalCredentialAwarded: `${course.title} - Yoga Alliance RYT-${course.slug.replace("hr", "")}`,
        numberOfCredits: {
          "@type": "StructuredValue",
          value: parseInt(course.duration.split(" ")[0]),
          unitCode: "HUR",
        },
      }),
    }}
  />
);

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
export const LocalBusinessSchema = () => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "@id": "https://baliyttc.com/#organization",
        name: SITE.name,
        image: "https://baliyttc.com/logo.png",
        priceRange: "€€€",
        servesCuisine: "Vegetarian",
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
