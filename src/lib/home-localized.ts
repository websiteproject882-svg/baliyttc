export type HomeLocale = "en" | "es" | "de" | "fr" | "id" | "ko" | "zh" | "ja" | "ru";

export type Card = { title: string; desc: string; points?: string[] };
export type Teacher = { role: string; bio: string; experience: string };
export type Batch = { tuition: string; person: string; cta: string; guarantees: Card[] };
export type HomeCopy = {
  common: {
    view: string;
    learnMore: string;
    galleryEyebrow: string;
    galleryTitle: string;
    galleryAccent: string;
    viewGallery: string;
    galleryItems: string[];
  };
  trust: {
    recognised: string;
    certificationMeaning: string;
    metrics: Array<{ label: string; sub: string }>;
  };
  intro: {
    eyebrow: string;
    title: string;
    subtitle: string;
    body: string;
    cta: string;
    stats: Array<{ value: string; label: string }>;
  };
  manifesto: {
    eyebrow: string;
    title: string;
    accent: string;
    description: string;
    previous: string;
    next: string;
    cards: Array<Card & { eyebrow: string }>;
  };
  pillars: Card[];
  experiences: {
    eyebrow: string;
    title: string;
    accent: string;
    subtitle: string;
    mobileHint: string;
    cards: Card[];
  };
  teachers: {
    eyebrow: string;
    title: string;
    accent: string;
    subtitle: string;
    viewAll: string;
    cta: string;
    items: Teacher[];
  };
  schedule: {
    eyebrow: string;
    title: string;
    subtitle: string;
    batchStatuses: string[];
    batchCourses: string[];
    batch: Batch;
  };
  testimonials: {
    eyebrow: string;
    title: string;
    accent: string;
    subtitle: string;
    verified: string;
    topRated: string;
    readVerified: string;
    startJourney: string;
    viewAll: string;
    items: Array<{ course: string; quote: string }>;
  };
  video: {
    eyebrow: string;
    title: string;
    subtitle: string;
    campusAlt: string;
    reviewEyebrow: string;
    reviewTitle: string;
    reviewSubtitle: string;
    previousReview: string;
    nextReview: string;
    playReview: string;
    facilitiesTitle: string;
    facilitiesSubtitle: string;
    whyTitle: string;
    facilities: Card[];
    points: string[];
    reviews: Array<{ name: string; course: string; quote: string }>;
  };
  finalCta: {
    eyebrow: string;
    title: string;
    accent: string;
    subtitle: string;
    primary: string;
    secondary: string;
    benefits: string[];
    imageAlt: string;
  };
};

export const defaultHomeCopy: HomeCopy = {
  common: {
    view: "View",
    learnMore: "Learn more",
    galleryEyebrow: "Inside Bali YTTC",
    galleryTitle: "Authentic Moments from",
    galleryAccent: "Ubud",
    viewGallery: "View Full Gallery",
    galleryItems: [
      "Open-air shala",
      "Morning practice",
      "Sattvic meals",
      "Temple ceremony",
      "Jungle training",
      "Student community",
    ],
  },
  trust: {
    recognised: "Accreditations & Professional Authority",
    certificationMeaning: "What Yoga Alliance certification means",
    metrics: [
      { label: "Students trained", sub: "worldwide since 2018" },
      { label: "Average rating", sub: "verified reviews" },
      { label: "Yoga Alliance", sub: "200hr & 300hr certified" },
      { label: "Years experience", sub: "combined faculty" },
    ],
  },
  intro: {
    eyebrow: "The Sanctuary of Wisdom",
    title: "Where ancient lineage meets modern spiritual transformation.",
    subtitle:
      "Bali YTTC is a dedicated yoga school in the sacred highlands of Ubud, created for students who want more than a certificate.",
    body:
      "Since 2018, we have guided students from 70+ countries through Yoga Alliance certified training that blends traditional Vedic philosophy, precise alignment, teaching practice, pranayama, meditation and Balinese culture.",
    cta: "Discover our philosophy",
    stats: [
      { value: "2,500+", label: "Graduates" },
      { value: "70+", label: "Nationalities" },
      { value: "4.9/5", label: "Average rating" },
    ],
  },
  manifesto: {
    eyebrow: "Why Choose Us",
    title: "More Than a",
    accent: "Certification",
    description:
      "Bali YTTC is a sanctuary of deep learning. We merge authentic Vedic philosophy with modern alignment in Ubud's most healing environment.",
    previous: "Scroll why choose us left",
    next: "Scroll why choose us right",
    cards: [
      {
        eyebrow: "Graduation Day",
        title: "Yoga Alliance Certified",
        desc: "Fully accredited RYS 200 and 300 registry recognized worldwide for international teaching.",
      },
      {
        eyebrow: "Sanctuary Life",
        title: "All-Inclusive Ubud Sanctuary",
        desc: "Immersive stay, plant-based meals, daily practice space, and complete course materials.",
      },
      {
        eyebrow: "Lifetime Connection",
        title: "Global Alumni Community",
        desc: "Join an expansive network of graduates from 70+ countries practicing and teaching worldwide.",
      },
      {
        eyebrow: "Practical Mastery",
        title: "Hands-on Teaching Practice",
        desc: "Graduate with real teaching experience, direct alignment feedback, and classroom confidence.",
      },
      {
        eyebrow: "Sacred Culture",
        title: "Traditional Balinese Blessings",
        desc: "Take part in purification ceremonies, flower blessings, and temple-based cultural learning.",
      },
      {
        eyebrow: "Ongoing Mentorship",
        title: "Lifetime Support & Mentorship",
        desc: "Access continuing guidance, teacher check-ins, school updates, and career direction after graduation.",
      },
    ],
  },
  pillars: [
    {
      title: "Asana Mastery",
      desc: "Alignment-based practice across Hatha, Ashtanga and Vinyasa.",
      points: ["Multi-style lineage teaching", "Advanced sequencing templates", "Therapeutic modifications and prop guides"],
    },
    {
      title: "Pranayama & Breath",
      desc: "Breath techniques to refine energy and awareness.",
      points: ["Classical daily breath techniques", "Nervous-system regulation", "Safe pranayama for mixed levels"],
    },
    {
      title: "Applied Anatomy",
      desc: "Functional anatomy applied to safe, intelligent teaching.",
      points: ["Functional movement principles", "Injury-aware teaching choices", "Body mechanics for safe practice"],
    },
    {
      title: "Vedic Philosophy",
      desc: "Yoga Sutras, Bhagavad Gita and the eight limbs.",
      points: ["Yoga Sutras and Bhagavad Gita", "Living philosophy beyond the mat", "Ethics and yogic lifestyle foundations"],
    },
    {
      title: "Teaching Methodology",
      desc: "Cueing, sequencing and the art of holding space.",
      points: ["Cueing and class architecture", "Holding space with confidence", "Practice teaching with feedback"],
    },
    {
      title: "Hands-on Adjustments",
      desc: "Hands-on assists with consent and clarity.",
      points: ["Consent-led assisting principles", "Clear and safe adjustment technique", "Alignment feedback for confidence"],
    },
    {
      title: "Meditation & Balinese Wisdom",
      desc: "Guided meditation, inner stillness, Balinese ceremony and cultural wisdom.",
      points: ["Guided meditation practices", "Balinese ceremony and cultural context", "Integrating wisdom and teaching voice"],
    },
  ],
  experiences: {
    eyebrow: "Beyond the Mat",
    title: "Daily immersions, sacred ceremonies &",
    accent: "cultural integration",
    subtitle:
      "Every training week features temple rituals, advanced workshops, beach practices, and meditative arts rooted in Balinese culture.",
    mobileHint: "Tap any experience to learn more about what awaits you.",
    cards: [
      { title: "Temple Purification", desc: "A sacred Balinese cleansing ceremony in the first week." },
      { title: "Arm Balancing Workshop", desc: "Guided technique for strength, trust and balance." },
      { title: "Sound Healing", desc: "Tibetan bowls and sound therapy for deep integration." },
      { title: "Acro Yoga", desc: "Partner practice with trust, play and presence." },
      { title: "Beach Yoga", desc: "Sunrise practice on Bali's quiet eastern coast." },
      { title: "Mandala Painting", desc: "A meditative art practice to realign the mind." },
    ],
  },
  teachers: {
    eyebrow: "Meet Your Guides",
    title: "World-Class Teachers",
    accent: "Walking the Path",
    subtitle: "Experienced instructors guide you with precision, compassion and lived practice.",
    viewAll: "View All Teachers",
    cta: "Learn directly from Yoga Alliance certified instructors with international experience",
    items: [
      { role: "Lead Teacher / Founder", bio: "Vivek blends classical Hatha discipline with fluid Vinyasa and authentic lineage.", experience: "15+ years of teaching experience" },
      { role: "Senior Teacher", bio: "Sachin teaches precise alignment, intelligent sequencing and safe adjustments.", experience: "15+ years of teaching experience" },
      { role: "Vinyasa & Sound Specialist", bio: "Yuli brings Balinese warmth through Vinyasa, Yin Yoga and sound healing.", experience: "15+ years of teaching experience" },
      { role: "Philosophy Master", bio: "Sandeep bridges ancient texts and modern application for spiritual depth.", experience: "15+ years of teaching experience" },
    ],
  },
  schedule: {
    eyebrow: "Upcoming batches",
    title: "Secure Your Place for",
    subtitle: "Small cohorts for personalized attention. Limited spots available per batch.",
    batchStatuses: ["6 seats left", "Only 4 seats left", "Enrolment open", "Open", "Open"],
    batchCourses: ["100-Hour YTT", "200-Hour YTT", "300-Hour YTT", "200-Hour YTT", "100-Hour YTT"],
    batch: {
      tuition: "Tuition Fee",
      person: "/ person",
      cta: "Secure Your Spot",
      guarantees: [
        { title: "Money-back Guarantee", desc: "If you're not satisfied" },
        { title: "Flexible Dates", desc: "Switch batches anytime" },
        { title: "Early Bird Perks", desc: "Discounts available" },
      ],
    },
  },
  testimonials: {
    eyebrow: "Student Success Stories",
    title: "Stories from our",
    accent: "Empowered Graduates",
    subtitle: "Real transformations from yoga students who completed training in Ubud.",
    verified: "verified reviews",
    topRated: "Top rated in Bali",
    readVerified: "Read verified reviews from graduates worldwide",
    startJourney: "Start Your Journey",
    viewAll: "View All Reviews",
    items: [
      { course: "200-Hour Graduate", quote: "I felt supported throughout the entire training and learned far more than I expected." },
      { course: "200-Hour YTT Graduate", quote: "This training was life-changing and gave me clarity, strength and peace." },
      { course: "200-Hour YTT Graduate", quote: "The teachers, nature and structure made this a magical place to learn." },
    ],
  },
  video: {
    eyebrow: "Campus & Community",
    title: "Experience the Sanctuary",
    subtitle: "Walk through our yoga sanctuary in Ubud and see where transformation happens.",
    campusAlt: "Bali YTTC Campus",
    reviewEyebrow: "Student Review Videos",
    reviewTitle: "Watch Real Student Stories",
    reviewSubtitle: "Real Bali YTTC graduates sharing their teacher training journey, practice, and transformation.",
    previousReview: "Previous review video",
    nextReview: "Next review video",
    playReview: "Play review video",
    facilitiesTitle: "World-Class Facilities",
    facilitiesSubtitle: "Everything you need for distraction-free practice",
    whyTitle: "Why Students Choose Bali YTTC",
    facilities: [
      { title: "Professional Studio", desc: "Yoga studios with equipment and serene ambiance." },
      { title: "Sacred Gardens", desc: "Peaceful gardens for meditation and pranayama." },
      { title: "Comfortable Lodging", desc: "Clean rooms with amenities for focused practice." },
      { title: "Organic Meals", desc: "Plant-based meals prepared fresh daily." },
      { title: "Welcoming Community", desc: "Connect with practitioners from around the world." },
      { title: "Spiritual Location", desc: "Located in Ubud, Bali's spiritual heart." },
    ],
    points: [
      "Internationally certified Yoga Alliance programs",
      "Expert instructors with deep teaching experience",
      "All-inclusive pricing with accommodation and meals",
      "Thousands of students transformed since 2018",
      "Lifetime access to alumni community",
      "Supportive and structured learning environment",
    ],
    reviews: [
      { name: "Bastian from Germany", course: "Yoga Teacher Training Review", quote: "A real student review from Bali YTTC's 200-hour yoga teacher training experience." },
      { name: "200-Hour YTT Testimonial", course: "Student Testimonial", quote: "Honest feedback from a graduate after completing the 200-hour Yoga Teacher Training at Bali YTTC." },
      { name: "Student Review in Bali", course: "200-Hour Course Review", quote: "A short student review sharing the training atmosphere, learning journey, and Bali experience." },
      { name: "Stephanie from Belgium", course: "Wonderful Journey Review", quote: "A graduate story from Belgium about the 200-hour Yoga Teacher Training journey in Bali." },
    ],
  },
  finalCta: {
    eyebrow: "June 2026 · Only 4 seats remaining",
    title: "Begin your training journey in",
    accent: "Ubud",
    subtitle: "Join 2,500+ graduates in an all-inclusive, Yoga Alliance certified training with small batches and guided practice.",
    primary: "Secure Your Spot",
    secondary: "View Trainings",
    benefits: ["30-day cancellation", "Installments available", "RYS certified school"],
    imageAlt: "Bali YTTC graduates in Ubud",
  },
};

export function getHomeCopy(): HomeCopy {
  return defaultHomeCopy;
}
