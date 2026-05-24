"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ApplyModal } from "@/components/shared/ApplyModal";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/Reveal";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { IMG } from "@/data/site";
import {
  Award,
  BookOpen,
  CalendarDays,
  Check,
  GraduationCap,
  HeartHandshake,
  Loader2,
  MapPin,
  Plane,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
  ArrowUpRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { StaticCoursePageData } from "@/lib/course-static";

const includedList = [
  "Yoga Alliance certification on graduation",
  "Daily asana, pranayama & meditation",
  "Sattvic vegetarian meals (3x daily)",
  "Shared villa accommodation",
  "All workshops & ceremonies",
  "Excursions: temple, beach, sound healing",
  "Course manual & study materials",
  "Welcome & graduation ceremonies",
];

const notIncluded = [
  "Flights to/from Denpasar (DPS)",
  "Visa fees",
  "Personal travel insurance",
  "Private room upgrade (optional)",
];

const accommodationTiers = [
  {
    name: "Shared Villa",
    price: "Included",
    desc: "Shared twin room with en-suite bathroom, AC, hot water, Wi-Fi and access to the campus pool.",
    image: IMG.sharedVilla,
    featured: false,
    features: ["Twin sharing", "En-suite", "AC", "Wi-Fi", "Pool access"],
  },
  {
    name: "Private Villa",
    price: "+ EUR 400",
    desc: "Private room with en-suite bathroom, AC, hot water, daily housekeeping, Wi-Fi and quiet personal space.",
    image: IMG.privateVillaRoom,
    featured: true,
    features: ["Private room", "Housekeeping", "En-suite", "AC", "Hot water"],
  },
];

const accommodationGallery = [
  { title: "Private Villa Outside", image: IMG.privateVillaOutside },
  { title: "Campus Swimming Pool", image: IMG.swimmingPool },
  { title: "Room View", image: IMG.roomView },
  { title: "Yoga Studio", image: IMG.yogaStudio },
];

const toActivitySlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

interface Course {
  id: string;
  slug: string;
  name: string;
  duration: string;
  summary: string;
  description: string;
  priceFrom: number;
  priceFull?: number;
  image: string;
  modules: { title: string; description: string; hours: number }[];
  batches?: { id: string; name: string; startDate: string; priceRegular: number; enrolled: number; capacity: number }[];
}

const courseDetails = {
  "50hr": {
    name: "50-Hour Hatha-Vinyasa Yoga Teacher Training in Bali",
    summary:
      "A focused 6-day, 5-night Hatha-Vinyasa foundation in Ubud for beginners who want traditional practice, sun salutations, alignment, breathwork and first-step teaching confidence.",
    description:
      "This 50-hour Hatha-Vinyasa training is a compact foundation course for students new to yoga or anyone wanting to deepen traditional practice in a short format. The course introduces Hatha and Vinyasa asana, sun salutations, posture categories, basic sequencing, alignment, pranayama, meditation, mantra, anatomy and beginner teaching practice in a supportive Bali setting.",
    image: IMG.yogaStudio,
    eyebrow: "50-Hour YTT in Bali",
    foundationTitle: <>Short Hatha-Vinyasa <em className="text-terra">Foundation</em></>,
    curriculumTitle: "What the 50-hour training covers",
    pricingTitle: <>50-hour Course <em className="text-terra">Fees</em></>,
    pricingSub: "A short-format training with tuition-only and stay-included options. Admin can adjust seasonal pricing later.",
    faqEyebrow: "50-Hour FAQ",
    intro:
      "A practical short course for students who want a serious start without committing to a full 100-hour or 200-hour program. It focuses on traditional Hatha fundamentals, Vinyasa flow basics and confidence-building teaching practice.",
    focus: [
      {
        title: "Short Course Format",
        desc: "Designed for students with limited time who still want structured training, daily practice and a real Bali YTTC learning environment.",
      },
      {
        title: "Hatha-Vinyasa Basics",
        desc: "Learn the foundations of traditional Hatha practice and breath-led Vinyasa flow in a simple, accessible format.",
      },
      {
        title: "Beginner Friendly",
        desc: "No prior teacher training is required. The course gives a clear foundation for future 100-hour or 200-hour study.",
      },
    ],
    curriculum: [
      {
        title: "Hatha & Vinyasa Practice",
        desc: "Learn warm-ups, traditional Hatha sun salutations, Ashtanga-inspired sun salutation rhythm and basic Vinyasa flow structure.",
        points: ["Pawanmuktasana warm-up", "Hatha and Ashtanga sun salutations", "Vinyasa flow variations"],
      },
      {
        title: "Asana Concepts",
        desc: "Understand posture categories, effects, benefits and how standing, seated, prone, supine and closing postures support body and mind.",
        points: ["Standing and seated postures", "Prone and supine poses", "Inversions and closing sequence"],
      },
      {
        title: "Alignment & Modification",
        desc: "Refine your understanding of asana through safe entry and exit, posture anatomy, benefits, modifications and intelligent prop use.",
        points: ["Anatomy of posture", "Alignment and modification", "Props for different bodies"],
      },
      {
        title: "Teaching Practice",
        desc: "Start practicing from day one with simple cueing, one-to-one teaching, small group guidance and supervised feedback from senior teachers.",
        points: ["Basic cueing", "One-to-one teaching practice", "Small group feedback"],
      },
      {
        title: "Hands-on Adjustments",
        desc: "Learn the art of safe, respectful beginner-level adjustment through observation, communication and posture-specific support.",
        points: ["Consent-based touch", "Hands-on adjustment basics", "Observation skills"],
      },
      {
        title: "Mantra, Meditation & Pranayama",
        desc: "Build a daily inner practice through pranayama, meditation methods and mantra chanting that support mental and physical steadiness.",
        points: ["Pranayama techniques", "Meditation basics", "Mantra chanting"],
      },
      {
        title: "Anatomy Basics",
        desc: "Study key body systems and how asana, pranayama and meditation support wellbeing.",
        points: ["Skeletal system", "Muscular system", "Respiratory and digestive basics"],
      },
    ],
    schedule: [
      { time: "06:00 - 09:00", title: "Mantra, Pranayama & Asana", desc: "Cleansing, breathwork and guided Hatha-Vinyasa practice." },
      { time: "09:00 - 10:15", title: "Breakfast", desc: "A nourishing plant-based meal before theory and teaching work." },
      { time: "10:15 - 13:00", title: "Anatomy & Yoga Foundations", desc: "Body awareness, posture anatomy and yoga theory in simple language." },
      { time: "13:15 - 14:00", title: "Lunch", desc: "A short break for food, notes and recovery." },
      { time: "15:00 - 16:30", title: "Alignment, Adjustment & Teaching", desc: "Hands-on learning, cueing practice and basic sequencing." },
      { time: "16:30 - 19:30", title: "Asana, Meditation & Dinner", desc: "Closing movement, meditation and dinner." },
    ],
    activities: [
      {
        title: "Holy Temple Purification",
        desc: "A respectful Balinese cleansing experience with etiquette guidance and intention setting.",
        image: IMG.templePurification,
      },
      {
        title: "Balinese Welcome Ceremony",
        desc: "A grounding campus ceremony that helps the group arrive, connect and begin with shared intention.",
        image:
          "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:864/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Balinese-Welcome-Ceremony-for-YTT.jpg",
      },
      {
        title: "Acro Yoga Workshop",
        desc: "A beginner-friendly partner workshop for balance, trust, communication and playful confidence.",
        image: IMG.acroYoga,
      },
    ],
    pricing: [
      {
        name: "Without Accommodation",
        was: "EUR 699",
        price: "EUR 399",
        desc: "Training package for students arranging their own stay in Ubud.",
        included: ["Hatha, Ashtanga and Vinyasa basics", "Excursion and cultural activity", "Yoga equipment", "Foundation certificate"],
      },
      {
        name: "Private Villa",
        was: "EUR 1299",
        price: "EUR 799",
        desc: "Six-day short course with private stay, meals and training rhythm included.",
        included: ["6 days meals and accommodation", "Excursions", "All yoga equipment", "Foundation certificate"],
        featured: true,
      },
    ],
    faqs: [
      {
        q: "Do I need prior experience for the 50-hour YTT?",
        a: "No. The course is designed for complete beginners and early practitioners who want a clear foundation.",
      },
      {
        q: "Can I teach professionally after 50 hours?",
        a: "This course gives foundational teaching skills. For professional teaching, a longer certification such as 200 hours is usually recommended.",
      },
      {
        q: "Is this course Yoga Alliance certified?",
        a: "It is a foundation course that can support your pathway toward future Yoga Alliance certification programs.",
      },
      {
        q: "How long is the 50-hour training?",
        a: "The 50-hour Hatha-Vinyasa training is a 6-day short course in Ubud, Bali.",
      },
    ],
  },
  "100hr": {
    name: "100-Hour Multi-Style Yoga Teacher Training",
    summary:
      "An 11-day beginner-friendly Yoga Alliance pathway in Hatha, Ashtanga and Vinyasa, created for students starting their yoga journey in Bali.",
    description:
      "This 100-hour training is a compact first immersion into authentic yoga. Students build foundations in asana, breathwork, philosophy, anatomy and teaching practice while experiencing Ubud's cultural and spiritual rhythm.",
    image:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:1080/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/09/100-hour-Yoga-Teacher-Training-Vinyasa-class-in-Bali.jpg",
    eyebrow: "100-Hour YTT in Bali",
    foundationTitle: <>Beginner Multi-Style <em className="text-terra">Foundation</em></>,
    curriculumTitle: "What the 100-hour training covers",
    pricingTitle: <>Simple 100-hour <em className="text-terra">Pricing</em></>,
    pricingSub: "Reserve the course with a EUR 200 deposit. Early-bird rates can be switched from admin later when seasonal pricing is final.",
    faqEyebrow: "100-Hour FAQ",
    intro:
      "A beginner-friendly 11-day immersion for students who want a serious first step into Hatha, Ashtanga and Vinyasa practice. The program builds practical foundations, personal discipline and teaching confidence without requiring prior yoga training.",
    focus: [
      {
        title: "Multi-Style Foundation",
        desc: "Train across Hatha, Ashtanga and Vinyasa so you understand alignment, breath-led movement and classical structure from the start.",
      },
      {
        title: "Beginner Friendly",
        desc: "Designed for new students and early practitioners who want a clear, supportive introduction to yoga teacher training in Bali.",
      },
      {
        title: "Certification Pathway",
        desc: "Use this as a compact immersion or the first half of a longer 200-hour certification journey.",
      },
    ],
    curriculum: [
      {
        title: "Asana Practice & Sequencing",
        desc: "Sun salutations, standing postures, seated work, supine and prone poses, inversions and closing sequences.",
        points: ["Hatha and Ashtanga sun salutations", "Led and Mysore-style Ashtanga basics", "Theme-based Vinyasa flow structure"],
      },
      {
        title: "Alignment, Props & Adjustments",
        desc: "Learn safe entry and exit, practical modifications, posture anatomy and beginner-level hands-on support.",
        points: ["Safe alignment principles", "Props and modifications", "Hands-on adjustment workshops"],
      },
      {
        title: "Teaching Practice",
        desc: "Practice teaching starts early, moving from one-to-one guidance to small group teaching with senior teacher feedback.",
        points: ["Cueing and class structure", "Small group teaching drills", "Feedback from senior instructors"],
      },
      {
        title: "Philosophy & Yogic Lifestyle",
        desc: "A practical introduction to the Yoga Sutras, Bhagavad Gita, Vedic ideas and how yogic living applies outside the mat.",
        points: ["Eight limbs of yoga", "Foundational yogic texts", "Daily lifestyle integration"],
      },
      {
        title: "Pranayama, Meditation & Mantra",
        desc: "Daily breathwork, concentration practice and mantra chanting to build discipline, awareness and energetic steadiness.",
        points: ["Cleansing and breath practices", "Meditation methods", "Mantra chanting"],
      },
      {
        title: "Anatomy & Yoga Therapy Basics",
        desc: "Understand the skeleton, muscles, breath, digestion and basic wellbeing principles behind safe yoga practice.",
        points: ["Functional anatomy basics", "Body systems overview", "Yoga therapy introduction"],
      },
    ],
    schedule: [
      { time: "Morning", title: "Mantra, Pranayama & Asana", desc: "Cleansing, breathwork and guided physical practice." },
      { time: "Breakfast", title: "Sattvic Meal", desc: "Plant-based food prepared for training days." },
      { time: "Late Morning", title: "Philosophy & Anatomy", desc: "Theory classes for body, mind and yogic foundations." },
      { time: "Lunch", title: "Rest & Integration", desc: "A quiet pause before afternoon training." },
      { time: "Afternoon", title: "Alignment & Teaching Lab", desc: "Adjustment, cueing and teaching practice." },
      { time: "Evening", title: "Asana, Meditation & Dinner", desc: "Closing practice followed by dinner." },
    ],
    activities: [
      {
        title: "Temple Purification",
        desc: "A Balinese cleansing ceremony during the first week to connect with local culture and intention.",
        image: IMG.templePurification,
      },
      {
        title: "Acro Yoga Workshop",
        desc: "A beginner workshop focused on trust, balance, play and partner awareness.",
        image: IMG.acroYoga,
      },
      {
        title: "Sound Healing",
        desc: "A restorative sound session for nervous system reset and post-training integration.",
        image: IMG.soundHealing,
      },
    ],
    pricing: [
      {
        name: "Tuition Only",
        was: "EUR 999",
        price: "EUR 699",
        desc: "Early-bird foundation package for students arranging their own stay.",
        included: ["Yoga Alliance pathway", "Training equipment", "Excursion and sound healing"],
      },
      {
        name: "Shared Stay",
        was: "EUR 1399",
        price: "EUR 999",
        desc: "Training with meals and shared accommodation for the full 11-day immersion.",
        included: ["11 days meals and stay", "All training equipment", "Certification support"],
        featured: true,
      },
      {
        name: "Private Room",
        was: "EUR 1699",
        price: "EUR 1299",
        desc: "A quieter room option for students who want more privacy during the course.",
        included: ["Private accommodation", "Meals and training", "Excursions and workshops"],
      },
    ],
    faqs: [
      {
        q: "Is the 100-hour YTT suitable for beginners?",
        a: "Yes. It is built for beginners and early practitioners who want a clear, structured start without needing previous teacher training experience.",
      },
      {
        q: "Can I teach professionally after only 100 hours?",
        a: "The 100-hour course is best treated as a foundation. For most professional teaching roles, the standard path is completing a 200-hour certification.",
      },
      {
        q: "How long is the course?",
        a: "The 100-hour training runs for 11 days and 10 nights in Ubud, Bali.",
      },
      {
        q: "How do I reserve my seat?",
        a: "A EUR 200 deposit secures your place. If your travel plan changes, the booking can be rescheduled according to the school policy.",
      },
    ],
  },
  "200hr": {
    name: "200-Hour Hatha Ashtanga Vinyasa YTT in Bali",
    summary:
      "A 21-day Yoga Alliance certified teacher training in Ubud for beginners and committed practitioners, covering Hatha, Ashtanga, Vinyasa, anatomy, philosophy and teaching methodology.",
    description:
      "This 200-hour training is Bali YTTC's complete foundation program for students who want to become confident yoga teachers. It blends daily practice, detailed alignment, supervised teaching labs, yogic philosophy, anatomy, pranayama, meditation and Balinese cultural experiences.",
    image:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:1080/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/200-hour-Yoga-Teacher-Training-for-Beginners.jpg",
    eyebrow: "200-Hour YTT in Bali",
    foundationTitle: <>Complete Teacher Training <em className="text-terra">Pathway</em></>,
    curriculumTitle: "What the 200-hour training covers",
    pricingTitle: <>200-hour Course <em className="text-terra">Fees</em></>,
    pricingSub: "Use a EUR 300 deposit to reserve your place. Final public rates can stay admin-controlled for early-bird and seasonal pricing.",
    faqEyebrow: "200-Hour FAQ",
    intro:
      "A full 21-day residential immersion for beginners and intermediate students who want a complete Yoga Alliance certified training. The course develops personal practice, teaching confidence and a grounded understanding of yoga as a complete lifestyle.",
    focus: [
      {
        title: "Hatha, Ashtanga & Vinyasa",
        desc: "Build a rounded practice across traditional Hatha, Ashtanga Primary Series foundations and creative Vinyasa sequencing.",
      },
      {
        title: "Small Batch Guidance",
        desc: "A focused group format gives students more personal correction, teacher feedback and space to ask questions.",
      },
      {
        title: "Teach Worldwide",
        desc: "Complete the program to receive a Yoga Alliance aligned 200-hour certificate and begin your professional teaching journey.",
      },
    ],
    curriculum: [
      {
        title: "Vinyasa & Hatha Yoga Practice",
        desc: "Daily asana classes cover sun salutations, standing and seated postures, safe progression and theme-based Vinyasa flows.",
        points: ["Hatha sun salutations", "Ashtanga sun salutations", "Vinyasa flow creation"],
      },
      {
        title: "Ashtanga Vinyasa Foundation",
        desc: "Learn the structure of Led and Mysore-style Ashtanga practice with practical sequencing, rhythm and breath-led movement.",
        points: ["Primary series basics", "Led class structure", "Breath and drishti awareness"],
      },
      {
        title: "Alignment, Modification & Props",
        desc: "Refine how each posture works, how to enter and exit safely, and how to adapt poses for different student bodies.",
        points: ["Posture anatomy", "Benefits and contraindications", "Props and modifications"],
      },
      {
        title: "Teaching Methodology",
        desc: "Practice cueing, sequencing and class delivery from early in the course, moving toward supervised group teaching.",
        points: ["Class planning", "Voice and cueing", "Practice teaching feedback"],
      },
      {
        title: "Yoga Therapy & Anatomy",
        desc: "Study key body systems and learn how asana, pranayama and meditation can support wellbeing when taught responsibly.",
        points: ["Skeletal and muscular systems", "Respiratory and digestive systems", "Therapeutic applications"],
      },
      {
        title: "Mantra, Meditation & Pranayama",
        desc: "Daily breathwork, meditation methods and mantra chanting help students understand the inner practices behind yoga.",
        points: ["Pranayama techniques", "Meditation methods", "Mantra chanting"],
      },
      {
        title: "Yoga Philosophy",
        desc: "Study the core ideas behind yogic living through accessible lessons on classical texts and practical ethics.",
        points: ["Yoga Sutras", "Bhagavad Gita", "Yogic lifestyle and ethics"],
      },
      {
        title: "Ayurveda Introduction",
        desc: "A practical introduction to Ayurveda, body types, food habits and simple routines for daily balance.",
        points: ["Dosha basics", "Daily routine", "Food and lifestyle guidance"],
      },
    ],
    schedule: [
      { time: "06:15", title: "Mantra, Pranayama & Asana", desc: "Morning practice begins with breath, cleansing and guided asana." },
      { time: "Breakfast", title: "Plant-Based Meal", desc: "A nourishing pause before theory sessions." },
      { time: "Late Morning", title: "Philosophy & Anatomy", desc: "Core lectures on yoga philosophy, body systems and wellbeing." },
      { time: "Lunch", title: "Rest & Study", desc: "Meal break and time to integrate the morning classes." },
      { time: "Afternoon", title: "Alignment, Adjustment & Teaching", desc: "Hands-on labs, sequencing and supervised teaching practice." },
      { time: "Evening", title: "Asana, Meditation & Dinner", desc: "Closing practice, meditation and dinner around 7 PM." },
    ],
    activities: [
      {
        title: "Temple Purification",
        desc: "A Balinese cleansing ritual that gives students a meaningful cultural and spiritual experience.",
        image: IMG.balinesesTempleGateway,
      },
      {
        title: "Waterfall & Coffee Plantation",
        desc: "A refreshing excursion into Bali's nature and local culture during the training schedule.",
        image: IMG.beachYoga,
      },
      {
        title: "Acro Yoga & Sound Healing",
        desc: "Beginner-friendly partner practice and restorative sound work help students integrate the week.",
        image: "https://baliyttc.com/wp-content/uploads/2025/08/Acro-Yoga-Workshop-at-200-hour-YTT-BALI.jpg",
      },
    ],
    pricing: [
      {
        name: "Tuition Only",
        was: "EUR 1899",
        price: "EUR 1499",
        desc: "Training-only option for students arranging their own accommodation.",
        included: ["Hatha, Ashtanga and Vinyasa", "Training equipment", "Yoga Alliance certificate"],
      },
      {
        name: "Shared Stay",
        was: "EUR 2299",
        price: "EUR 1899",
        desc: "Full residential package with meals and shared accommodation for the 21-day course.",
        included: ["21 days meals and stay", "All course materials", "Excursions and ceremonies"],
        featured: true,
      },
      {
        name: "Private Room",
        was: "EUR 2699",
        price: "EUR 2299",
        desc: "A private room option for students who want quieter rest during the immersion.",
        included: ["Private accommodation", "Meals and training", "Workshops and certification"],
      },
    ],
    faqs: [
      {
        q: "Can a beginner join the 200-hour YTT?",
        a: "Yes. The course is built to welcome beginners while still giving committed practitioners enough depth in practice, theory and teaching methodology.",
      },
      {
        q: "Will I receive a certificate after the training?",
        a: "Yes. After successful completion, students receive a 200-hour Yoga Alliance aligned certificate for teaching yoga internationally.",
      },
      {
        q: "Is there free time during the 21-day training?",
        a: "Yes. The schedule is intensive, but breaks are built in for meals, rest, self-study and cultural integration.",
      },
      {
        q: "Is the 200-hour YTT suitable during pregnancy?",
        a: "No. Because the course includes intensive Ashtanga and Vinyasa practice with full training days, it is not recommended during pregnancy.",
      },
      {
        q: "What does a typical training day look like?",
        a: "Days usually begin around 6:15 AM and finish around 7:00 PM with asana, pranayama, philosophy, anatomy, teaching labs, meditation and meals.",
      },
    ],
  },
  "300hr": {
    name: "300-Hour Advanced Yoga Teacher Training in Bali",
    summary:
      "A 28-day advanced Yoga Alliance pathway for 200-hour graduates who want to deepen practice, refine teaching, study yoga therapy and move toward RYT-500 level training.",
    description:
      "This advanced 300-hour program is designed for certified 200-hour teachers ready to expand their knowledge and personal practice. The training goes deeper into advanced asana, sequencing, meditation, breathwork, energy body anatomy, yoga therapy, philosophy and practical teaching refinement.",
    image: IMG.course300,
    eyebrow: "300-Hour YTT in Bali",
    foundationTitle: <>Advanced Teacher <em className="text-terra">Pathway</em></>,
    curriculumTitle: "What the 300-hour training covers",
    pricingTitle: <>300-hour Advanced <em className="text-terra">Fees</em></>,
    pricingSub: "Reserve your place with a EUR 400 deposit. Final seasonal and early-bird pricing can remain admin-controlled.",
    faqEyebrow: "300-Hour FAQ",
    intro:
      "A deeper 28-day immersion for teachers who have already completed a 200-hour training and want stronger technical skill, richer philosophy, smarter sequencing and more mature teaching presence.",
    focus: [
      {
        title: "For 200-Hour Graduates",
        desc: "Built for students who already have a 200-hour foundation and are ready for advanced study and teaching refinement.",
      },
      {
        title: "Advanced Practice & Sequencing",
        desc: "Go deeper into advanced asana, intelligent sequencing, meditation, breathwork and the energetic structure behind practice.",
      },
      {
        title: "RYT-500 Direction",
        desc: "Use the course as the next step toward a higher Yoga Alliance teaching pathway and more confident professional teaching.",
      },
    ],
    curriculum: [
      {
        title: "Advanced Asana Practice",
        desc: "Refine strength, mobility and technique through deeper posture work, safe progressions and intelligent practice labs.",
        points: ["Advanced posture study", "Progressions and regressions", "Safe practice refinement"],
      },
      {
        title: "Advanced Sequencing",
        desc: "Learn how to design classes with purpose, progression and energetic arc for mixed-level and advanced students.",
        points: ["Peak pose sequencing", "Thematic class planning", "Energetic class structure"],
      },
      {
        title: "Energy Body Anatomy",
        desc: "Study subtle body concepts alongside breath and meditation practices to understand yoga beyond physical technique.",
        points: ["Pranic awareness", "Chakra and nadi concepts", "Breath-led energetic work"],
      },
      {
        title: "Yoga Therapy Foundations",
        desc: "Explore how yoga tools can support wellbeing when adapted responsibly for body type, limitation and student needs.",
        points: ["Therapeutic adaptation", "Responsible modifications", "Wellbeing-focused practice"],
      },
      {
        title: "Meditation & Pranayama Depth",
        desc: "Develop a stronger inner practice through advanced breathwork, concentration and meditation methods.",
        points: ["Advanced pranayama", "Meditation progression", "Mantra and inner focus"],
      },
      {
        title: "Philosophy & Personal Transformation",
        desc: "Use workshops, discussion and classical study to connect yogic philosophy with real teaching and daily life.",
        points: ["Deeper philosophy", "Teacher ethics", "Lifestyle integration"],
      },
      {
        title: "Advanced Teaching Methodology",
        desc: "Refine your voice as a teacher through advanced cueing, observation, feedback and practical teaching labs.",
        points: ["Advanced cueing", "Observation skills", "Mentored teaching practice"],
      },
      {
        title: "Alignment & Adjustment Mastery",
        desc: "Deepen your understanding of hands-on assists, consent, posture mechanics and student-specific correction.",
        points: ["Advanced alignment", "Hands-on assists", "Individual correction"],
      },
    ],
    schedule: [
      { time: "Morning", title: "Mantra, Pranayama & Advanced Asana", desc: "A focused start with breath, cleansing and deeper physical practice." },
      { time: "Breakfast", title: "Recovery Meal", desc: "Plant-based breakfast and time to reset." },
      { time: "Late Morning", title: "Philosophy, Anatomy & Therapy", desc: "Advanced theory, body systems, energy body and yoga therapy study." },
      { time: "Lunch", title: "Rest & Self-Study", desc: "Meal break, journaling and integration." },
      { time: "Afternoon", title: "Alignment, Adjustment & Teaching", desc: "Hands-on methodology, sequencing labs and mentored teaching practice." },
      { time: "Evening", title: "Meditation, Asana & Dinner", desc: "Closing practice, meditation and dinner to complete the day." },
    ],
    activities: [
      {
        title: "Temple Purification",
        desc: "A Balinese cleansing ceremony to ground the training in local spiritual culture.",
        image: IMG.templePurification,
      },
      {
        title: "Advanced Arm Balance Workshop",
        desc: "A technique-focused workshop for confidence, progression and intelligent strength.",
        image: IMG.armBalance,
      },
      {
        title: "Sound Healing & Integration",
        desc: "A restorative sound session to help the body and mind absorb the deeper training.",
        image: IMG.soundHealing,
      },
    ],
    pricing: [
      {
        name: "Tuition Only",
        was: "EUR 2299",
        price: "EUR 1899",
        desc: "Advanced training-only package for students arranging their own stay.",
        included: ["Advanced asana and sequencing", "Yoga therapy foundations", "RYT-500 pathway support"],
      },
      {
        name: "Shared Stay",
        was: "EUR 2699",
        price: "EUR 2299",
        desc: "Full 28-day residential training with meals and shared accommodation.",
        included: ["28 days meals and stay", "Advanced workshops", "Course materials and certification"],
        featured: true,
      },
      {
        name: "Private Room",
        was: "EUR 3199",
        price: "EUR 2799",
        desc: "Private room package for deeper rest during the intensive advanced immersion.",
        included: ["Private accommodation", "Meals and training", "Mentored teaching practice"],
      },
    ],
    faqs: [
      {
        q: "Who can join the 300-hour YTT?",
        a: "Students should have completed a 200-hour yoga teacher training first. This program is built for teachers ready for advanced study.",
      },
      {
        q: "How long is the 300-hour program?",
        a: "The 300-hour advanced training runs for 28 days in Bali.",
      },
      {
        q: "What will I learn in the 300-hour YTTC?",
        a: "You will study advanced asana, sequencing, deeper philosophy, yoga therapy foundations, meditation, pranayama, energy body anatomy and advanced teaching methodology.",
      },
      {
        q: "Is this course suitable for beginners?",
        a: "No. This is an advanced program for students who already have a 200-hour foundation.",
      },
    ],
  },
};

const expandedCurriculumPoints: Record<string, Record<string, string[]>> = {
  "50hr": {
    "Hatha & Vinyasa Practice": [
      "Traditional Hatha warm-ups and foundational standing postures",
      "Simple Vinyasa flow patterns linked with breath",
      "Sun salutation variations for short-format classes",
      "Safe pacing for beginners and mixed-level students",
    ],
    "Asana Concepts": [
      "Posture families, benefits and common mistakes",
      "How to observe alignment without overcorrecting students",
      "When to simplify a pose and when to use support",
    ],
    "Alignment & Modification": [
      "How to safely enter and exit foundational postures",
      "Basic anatomy of common yoga postures",
      "Props, modifications and beginner-friendly alternatives",
    ],
    "Teaching Practice": [
      "Short cueing drills from the first training days",
      "One-to-one teaching before small group practice",
      "Simple class structure for a 30-45 minute beginner class",
      "Teacher feedback on voice, timing and clarity",
    ],
  },
  "100hr": {
    "Asana Practice & Sequencing": [
      "Hatha and Ashtanga sun salutations with breath awareness",
      "Standing, seated, prone and supine posture families",
      "How to build a short beginner sequence with a clear peak",
      "Practice teaching starts from day one in small steps",
    ],
    "Alignment, Props & Adjustments": [
      "How to safely go in and out of a posture",
      "Anatomy of a yoga posture and common student patterns",
      "Benefits, precautions and basic contraindications",
      "Alignment and modification for different body types",
      "How to use props in Hatha, Ashtanga and Vinyasa classes",
      "Hands-on adjustment workshops supervised by senior teachers",
    ],
    "Teaching Practice": [
      "Cueing, demonstration and class presence",
      "One-to-one teaching before larger group teaching",
      "Supervised teaching with correction and feedback",
      "How to hold a calm class space as a beginner teacher",
    ],
    "Philosophy & Yogic Lifestyle": [
      "Introduction to the eight limbs of yoga",
      "Practical study of the Yoga Sutras and yogic ethics",
      "How philosophy applies to daily routine, discipline and teaching",
    ],
  },
  "200hr": {
    "Vinyasa & Hatha Yoga Practice": [
      "Hatha sun salutations, classical postures and breath-led practice",
      "Vinyasa flow sequencing for beginner and intermediate classes",
      "Standing, seated, prone, supine, inversion and relaxation postures",
      "How to create a balanced class from warm-up to final relaxation",
    ],
    "Ashtanga Vinyasa Foundation": [
      "Led and Mysore-style structure of Ashtanga practice",
      "Primary Series foundations, breath, drishti and bandha awareness",
      "Safe progression instead of forcing advanced postures",
    ],
    "Alignment, Modification & Props": [
      "How to safely go in and out of each posture",
      "Anatomy of yoga postures and movement patterns",
      "Benefits, limitations and practical contraindications",
      "Alignment, modification and prop usage in real classes",
      "Teaching from one-to-one correction to larger group guidance",
    ],
    "Teaching Methodology": [
      "Class planning, sequencing, cueing and timing",
      "Voice, presence and classroom management",
      "Practice teaching from early training days",
      "Senior teacher feedback after supervised teaching labs",
    ],
    "Yoga Therapy & Anatomy": [
      "Skeletal, muscular, respiratory and digestive system basics",
      "How yoga practice affects mobility, strength and nervous system balance",
      "Responsible therapeutic language and safe student support",
    ],
    "Yoga Philosophy": [
      "Yoga Sutras, Bhagavad Gita and the yogic view of practice",
      "Yamas, niyamas and ethics for modern teachers",
      "How to integrate philosophy without making classes too theoretical",
    ],
  },
  "300hr": {
    "Advanced Asana": [
      "Advanced posture progression with safety and patience",
      "Inversions, arm balances and transitions taught through preparation",
      "Refining personal practice without performance pressure",
    ],
    "Advanced Sequencing": [
      "Peak-pose sequencing and layered class design",
      "Energetic sequencing using breath, pace and posture families",
      "How to teach multi-level students in one class",
    ],
    "Yoga Therapy Foundations": [
      "Adapting yoga tools for common limitations and student needs",
      "Observation, modification and responsible scope of practice",
      "Using breath, rest and simple movement to support wellbeing",
    ],
    "Teaching Mentorship": [
      "Advanced cueing and subtle correction",
      "Mentored teaching labs with detailed feedback",
      "Building your voice as a senior teacher",
    ],
  },
};

const getCurriculumPoints = (slug: string, title: string, fallback: string[]) =>
  expandedCurriculumPoints[slug]?.[title] || fallback;

const twoHundredHeroStats = [
  { icon: CalendarDays, label: "Duration", value: "21 days", note: "Full residential immersion" },
  { icon: Award, label: "Certification", value: "200 hours", note: "Yoga Alliance aligned" },
  { icon: Users, label: "Format", value: "Small batch", note: "Feedback-led teaching labs" },
  { icon: MapPin, label: "Location", value: "Ubud, Bali", note: "Practice, meals and stay together" },
];

const twoHundredAnchors = [
  { href: "#curriculum", label: "Curriculum" },
  { href: "#roadmap", label: "21-day flow" },
  { href: "#teaching-lab", label: "Teaching labs" },
  { href: "#schedule", label: "Daily rhythm" },
  { href: "#fees", label: "Fees" },
  { href: "#batches", label: "Dates" },
];

const twoHundredBestFor = [
  "Beginners who want a complete first teacher training instead of a short intro course.",
  "Practitioners ready to build confidence in Hatha, Ashtanga and Vinyasa sequencing.",
  "Future teachers who want real cueing practice, supervised feedback and class planning.",
  "Students who want a residential Bali training with meals, culture and community included.",
];

const twoHundredOutcomes = [
  "Plan and teach a balanced beginner-to-intermediate yoga class.",
  "Understand alignment, modifications, contraindications and responsible assists.",
  "Use pranayama, meditation, mantra and philosophy as practical teaching tools.",
  "Graduate with a clear next step for teaching, self-practice or advanced training.",
];

const twoHundredRoadmap = [
  {
    phase: "Days 1-5",
    title: "Foundation & Practice Base",
    desc: "Set the rhythm: daily Hatha, Ashtanga foundations, pranayama, mantra and posture study.",
    points: ["Baseline alignment", "Breath-led practice", "Yoga lifestyle orientation"],
  },
  {
    phase: "Days 6-12",
    title: "Technique, Anatomy & Sequencing",
    desc: "Move deeper into posture families, body systems, prop use and how to build a safe class arc.",
    points: ["Functional anatomy", "Vinyasa sequencing", "Modification skills"],
  },
  {
    phase: "Days 13-18",
    title: "Teaching Practice & Feedback",
    desc: "Shift from student to teacher through cueing drills, class planning and supervised teaching labs.",
    points: ["Voice and timing", "Class management", "Teacher feedback"],
  },
  {
    phase: "Days 19-21",
    title: "Assessment & Graduation",
    desc: "Integrate the full course through practical assessment, ceremony and clear next-step guidance.",
    points: ["Final practicum", "Certification review", "Graduation ceremony"],
  },
];

const twoHundredTeachingLabs = [
  {
    icon: Target,
    title: "Practice teaching from early days",
    desc: "Students begin with short cueing drills, then build toward complete class sections with mentor feedback.",
  },
  {
    icon: HeartHandshake,
    title: "Adjustment with consent",
    desc: "Hands-on work is taught through observation, communication, props and safe student-specific support.",
  },
  {
    icon: BookOpen,
    title: "Usable class frameworks",
    desc: "You leave with repeatable class structures for Hatha, Vinyasa and beginner-friendly mixed-level groups.",
  },
];

const twoHundredTrustBlocks = [
  {
    icon: ShieldCheck,
    title: "Assessment & certification",
    desc: "Graduation is based on attendance, participation, teaching practice and a final practical review. Successful students receive the 200-hour certificate.",
  },
  {
    icon: Plane,
    title: "Arrival made simple",
    desc: "Plan to arrive before opening orientation. Denpasar airport, visa, insurance and personal travel costs stay separate from course fees.",
  },
  {
    icon: Sparkles,
    title: "Bali integration",
    desc: "Temple purification, nature time and restorative sessions are included so the course feels grounded, not only technical.",
  },
];

type CourseDeepDiveItem = {
  kicker: string;
  title: string;
  intro: string;
  details: string;
  points: string[];
  impact: string;
};

const courseDeepDives: Record<string, CourseDeepDiveItem[]> = {
  "50hr": [
    {
      kicker: "Start here",
      title: "Short course, real foundation",
      intro: "A focused six-day immersion for students who want a serious first step without committing to a long residential program.",
      details:
        "The 50-hour course keeps the learning clear and practical. You work with Hatha and Vinyasa fundamentals, safe posture transitions, simple sequencing, breath awareness and beginner teaching language. It is designed to remove confusion and give students a clean structure they can keep practising after the course.",
      points: ["Hatha and Vinyasa basics", "Beginner-friendly sequencing", "Daily breath and meditation", "Short teaching drills"],
      impact: "Best for students who want confidence, not overload.",
    },
    {
      kicker: "Technique",
      title: "Alignment made simple",
      intro: "Learn how common postures work, where students usually struggle and how to make practice safer.",
      details:
        "Instead of memorising pose names only, students study posture families, entry and exit points, basic anatomy and simple modifications. The goal is to understand the shape, purpose and safety of each posture so your practice becomes more intelligent.",
      points: ["Posture families", "Props and modifications", "Common alignment patterns", "Safe entry and exit"],
      impact: "You leave with practical body awareness for your own practice and future teaching.",
    },
    {
      kicker: "Inner work",
      title: "Breath, meditation and steadiness",
      intro: "A short training still needs inner practice, so each day includes pranayama, meditation and quiet integration.",
      details:
        "Breathwork and meditation are taught in a grounded way. Students learn simple techniques that calm the nervous system, improve focus and make physical practice more balanced. The practices are accessible for beginners and useful after the course ends.",
      points: ["Pranayama foundations", "Guided meditation", "Mantra introduction", "Daily self-practice rhythm"],
      impact: "The course becomes more than exercise; it becomes a daily discipline.",
    },
    {
      kicker: "Bali experience",
      title: "Culture without rushing",
      intro: "Even in a short course, students experience Bali through ceremony, community and mindful campus life.",
      details:
        "The course includes selected cultural and integration experiences so students feel the setting, not just the schedule. Ceremonies and workshops are introduced respectfully with context, etiquette and time to reflect.",
      points: ["Temple or ceremony context", "Community learning", "Restorative integration", "Simple local connection"],
      impact: "Students understand why Bali is part of the training, not only the location.",
    },
  ],
  "100hr": [
    {
      kicker: "01",
      title: "Multi-style approach",
      intro: "A balanced foundation across Hatha, Ashtanga and Vinyasa for students who want variety with structure.",
      details:
        "The 100-hour pathway introduces three important yoga streams without making the course feel scattered. Hatha builds alignment and steadiness, Ashtanga builds discipline and breath rhythm, while Vinyasa teaches intelligent movement and sequencing. Together they give beginners a rounded view of modern and traditional practice.",
      points: ["Hatha posture foundations", "Ashtanga rhythm and discipline", "Vinyasa flow creation", "Theme-based sequencing"],
      impact: "Students understand different styles and can choose their next path with clarity.",
    },
    {
      kicker: "02",
      title: "Perfect for beginners",
      intro: "Built for students who are new to yoga or returning after a long gap.",
      details:
        "No previous teacher training is required. The 11-day format gives enough time to learn vocabulary, posture basics, breathwork, simple anatomy and the first steps of teaching. Classes are structured to make new students feel supported while still giving committed practitioners meaningful depth.",
      points: ["Beginner-safe progressions", "Clear terminology", "Small teaching exercises", "Supportive correction"],
      impact: "A student can start with uncertainty and leave with a real foundation.",
    },
    {
      kicker: "03",
      title: "Teaching practice starts early",
      intro: "Students do not wait until the end to speak, cue and guide.",
      details:
        "Practice teaching begins in small steps: one-to-one cueing, short posture explanations, simple class sections and group feedback. This helps students build confidence gradually instead of feeling pressure on the final day.",
      points: ["Voice and timing", "One-to-one teaching", "Small group practice", "Senior teacher feedback"],
      impact: "The course builds teacher confidence from the first half of training.",
    },
    {
      kicker: "04",
      title: "Bali tradition and integration",
      intro: "The program includes culture, ceremony and restorative experiences that support the learning process.",
      details:
        "Students join selected Balinese experiences such as temple purification, sound healing, Acro Yoga or nature visits depending on the schedule. These experiences help students integrate training through trust, silence, community and respect for local culture.",
      points: ["Temple context", "Sound healing", "Partner practice", "Nature and reflection"],
      impact: "The training feels lived, not only studied.",
    },
  ],
  "200hr": [
    {
      kicker: "Flagship",
      title: "Complete Yoga Alliance foundation",
      intro: "A full 21-day pathway for students who want to become confident, responsible yoga teachers.",
      details:
        "The 200-hour program is the complete entry point for professional teaching. It gives enough time for daily practice, philosophy, anatomy, pranayama, meditation, sequencing, adjustment, teaching methodology and supervised practicum. The structure is intensive but progressive, so students grow step by step.",
      points: ["Daily multi-style practice", "Anatomy and philosophy", "Teaching methodology", "Final practical integration"],
      impact: "This is the strongest choice for students who want to teach internationally.",
    },
    {
      kicker: "Method",
      title: "From student mindset to teacher presence",
      intro: "The training develops how you observe, speak, sequence and hold a class space.",
      details:
        "Students learn to move beyond copying classes. They study class arcs, warm-ups, peak posture logic, cooling sequences, cueing, demonstration, classroom presence and student-specific support. Teaching labs turn theory into usable classroom skill.",
      points: ["Class planning", "Cueing and voice", "Observation skills", "Mentored feedback"],
      impact: "You graduate with teaching structure, not only a certificate.",
    },
    {
      kicker: "Safety",
      title: "Alignment, props and modification",
      intro: "A good teacher knows how to adapt practice for real bodies.",
      details:
        "The course studies posture mechanics, benefits, contraindications and modification. Students learn when to use props, how to simplify a pose, how to offer safe options and how to respect consent in hands-on adjustment.",
      points: ["Posture anatomy", "Contraindications", "Prop usage", "Consent-based assists"],
      impact: "Students learn to teach responsibly instead of forcing shapes.",
    },
    {
      kicker: "Immersion",
      title: "Residential rhythm in Ubud",
      intro: "Practice, meals, accommodation and community stay connected throughout the course.",
      details:
        "The residential format makes the learning deeper. Students stay close to the shala, eat plant-based meals, share community time and experience Bali through ceremonies, nature and restorative sessions. This rhythm supports focus and transformation.",
      points: ["Campus-based rhythm", "Sattvic meals", "Small community", "Bali cultural experiences"],
      impact: "The environment supports the work instead of distracting from it.",
    },
  ],
  "300hr": [
    {
      kicker: "Advanced",
      title: "For teachers ready to refine",
      intro: "A deeper course for 200-hour graduates who want stronger practice and more mature teaching.",
      details:
        "The 300-hour course assumes students already understand the basics. The training goes further into advanced asana, sequencing logic, subtle body work, meditation, pranayama, yoga therapy foundations and teacher mentorship.",
      points: ["Advanced asana", "Refined sequencing", "Subtle body study", "Teaching mentorship"],
      impact: "It is designed for growth after the first teaching foundation.",
    },
    {
      kicker: "Depth",
      title: "Advanced sequencing and class intelligence",
      intro: "Learn how to design classes with purpose, progression and energetic rhythm.",
      details:
        "Students explore peak-pose planning, layered sequencing, mixed-level teaching, breath pacing and energetic structure. The course helps teachers build classes that feel intentional rather than random.",
      points: ["Peak-pose sequencing", "Layered progressions", "Mixed-level teaching", "Energetic class arcs"],
      impact: "Your classes become clearer, safer and more memorable.",
    },
    {
      kicker: "Therapy",
      title: "Yoga therapy foundations",
      intro: "Understand how yoga tools can support wellbeing within responsible scope.",
      details:
        "The course introduces therapeutic adaptation through movement, breath, rest and observation. Students learn to modify practice for limitations while staying honest about scope and safety.",
      points: ["Adaptation principles", "Observation", "Breath and rest tools", "Responsible language"],
      impact: "Teachers learn to support students without overpromising.",
    },
    {
      kicker: "Mentorship",
      title: "Feedback for your real teaching voice",
      intro: "Advanced training should sharpen the teacher, not only add more content.",
      details:
        "Mentored teaching labs help students refine tone, presence, cueing, class management and confidence. Feedback is practical, direct and aimed at making each teacher more useful to real students.",
      points: ["Teacher presence", "Advanced cueing", "Observation and correction", "Personal feedback"],
      impact: "You leave with a more mature voice and clearer teaching identity.",
    },
  ],
};

const CoursePage = ({ initialCourse }: { initialCourse?: StaticCoursePageData | null }) => {
  const params = useParams();
  const router = useRouter();
  const slug = initialCourse?.slug || (params?.slug as string);

  const [course, setCourse] = useState<Course | StaticCoursePageData | null>(initialCourse ?? null);
  const [loading, setLoading] = useState(!initialCourse);
  const [selectedDeepDive, setSelectedDeepDive] = useState<CourseDeepDiveItem | null>(null);

  const fetchCourse = useCallback(async () => {
    if (initialCourse) {
      setCourse(initialCourse);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/courses?slug=${slug}&locale=${params?.locale || "en"}`);
      const data = await res.json();
      if (data.courses && data.courses.length > 0) {
        setCourse(data.courses[0]);
      } else {
        router.push("/courses");
      }
    } catch (error) {
      console.error("Failed to fetch course:", error);
      router.push("/courses");
    } finally {
      setLoading(false);
    }
  }, [initialCourse, params?.locale, router, slug]);

  useEffect(() => {
    if (!initialCourse && slug) {
      void fetchCourse();
    }
  }, [fetchCourse, initialCourse, slug]);

  useEffect(() => {
    if (loading || !course || typeof window === "undefined") return;

    const hash = window.location.hash.replace("#", "");
    if (!hash) return;

    window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  }, [course, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-terra" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const availableBatches = course.batches?.filter(b => b.enrolled < b.capacity) || [];
  const detail = courseDetails[course.slug as keyof typeof courseDetails];
  const isTwoHundredHour = course.slug === "200hr";
  const deepDiveItems = courseDeepDives[course.slug] || [];
  const isStaticFallbackCourse = course.id.startsWith("static-course-");
  const pageCourse = detail && isStaticFallbackCourse
    ? {
        ...course,
        name: detail.name,
        summary: detail.summary,
        description: detail.description,
        image: detail.image,
      }
    : {
        ...course,
        image: course.image || detail?.image || IMG.classMain,
      };
  const displayPriceFrom = course.priceFrom;

  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-20 md:pt-48 md:pb-28 overflow-hidden bg-warm-dark">
        <div className="absolute inset-0">
          <img
            src={pageCourse.image}
            alt={pageCourse.name}
            className="h-full w-full object-cover opacity-45"
            onError={(event) => {
              event.currentTarget.src = IMG.course100;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-warm-dark/88 via-warm-dark/68 to-warm-dark/45" />
        </div>
        <div className="container-wide relative">
          <div className="max-w-3xl">
            <Badge className="bg-white/20 text-white mb-4">{pageCourse.duration}</Badge>
            <h1 className="display-xl mb-6 text-white">
              {pageCourse.name}
            </h1>
            <p className="body-lg mb-8 text-white/80">{pageCourse.summary}</p>
            <div className="flex flex-wrap gap-4">
              <ApplyModal
                trigger={<Button size="lg" className="bg-terra hover:bg-terra-deep text-white">{displayPriceFrom < 1500 ? `Apply from EUR ${displayPriceFrom}` : "Apply Now"}</Button>}
                defaultCourse={course.slug}
              />
              <Link href="#batches">
                <Button size="lg" variant="secondary" className="bg-white text-warm-dark hover:bg-white/90">
                  View Dates
                </Button>
              </Link>
            </div>
            {isTwoHundredHour && (
              <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {twoHundredHeroStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="rounded-[10px] border border-white/15 bg-white/10 p-4 backdrop-blur">
                      <div className="flex items-center gap-2 text-white/70">
                        <Icon className="h-4 w-4" />
                        <span className="label-caps text-white/65">{stat.label}</span>
                      </div>
                      <p className="mt-3 text-lg font-semibold text-white">{stat.value}</p>
                      <p className="mt-1 text-xs leading-5 text-white/65">{stat.note}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {isTwoHundredHour && (
        <section className="border-b border-stone-200 bg-white">
          <div className="container-wide">
            <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
              <p className="label-caps text-sage">Explore the course</p>
              <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                {twoHundredAnchors.map((anchor) => (
                  <a
                    key={anchor.href}
                    href={anchor.href}
                    className="shrink-0 rounded-full border border-stone-200 bg-cream px-4 py-2 text-xs font-semibold text-warm-dark transition hover:border-terra hover:text-terra"
                  >
                    {anchor.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Course Overview */}
      <section className="py-16 bg-cream">
        <div className="container-wide">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <Reveal>
                <SectionHeading eyebrow="About This Course" title={<>What You&apos;ll <em className="text-terra">Learn</em></>} />
              </Reveal>
              <Reveal delay={0.1}>
                <div className="prose prose-lg max-w-none text-warm-mid">
                  <p className="text-lg leading-relaxed">{pageCourse.description}</p>
                </div>
              </Reveal>

              {/* Curriculum */}
              {!detail && course.modules && course.modules.length > 0 && (
                <Reveal delay={0.2}>
                  <div className="mt-12">
                    <h2 className="display-md mb-6 text-warm-dark">Curriculum</h2>
                    <Accordion type="single" collapsible className="space-y-4">
                      {course.modules.map((module, i) => (
                        <AccordionItem key={i} value={`module-${i}`} className="bg-white rounded-lg px-6 border border-warm-light/20">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="text-left">
                              <span className="text-xs text-terra font-medium">{module.hours} hours</span>
                              <p className="display-sm text-warm-dark">{module.title}</p>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-warm-mid pb-4">{module.description}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </Reveal>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Reveal>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-warm-light/20 sticky top-24">
                  <h3 className="display-sm mb-4 text-warm-dark">What&apos;s Included</h3>
                  <ul className="space-y-3">
                    {includedList.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-warm-mid text-sm">{item}</span>
                      </li>
                    ))}
                    {notIncluded.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <X className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-gray-400 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {detail && (
        <>
          <section className="py-14 md:py-16 bg-white">
            <div className="container-wide">
              <Reveal>
                <SectionHeading
                  eyebrow={detail.eyebrow}
                  title={detail.foundationTitle}
                  sub={detail.intro}
                />
              </Reveal>
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {detail.focus.map((item, i) => (
                  <Reveal key={item.title} delay={i * 0.08}>
                    <div className="h-full rounded-2xl border border-warm-light/40 bg-cream/70 p-6">
                      <span className="label-caps text-sage">{String(i + 1).padStart(2, "0")}</span>
                      <h3 className="display-sm mt-4 text-warm-dark">{item.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-warm-mid">{item.desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {deepDiveItems.length > 0 && (
            <section id="course-detail-notes" className="bg-[#F7F4EF] py-14 md:py-16 scroll-mt-28">
              <div className="container-wide">
                <Reveal>
                  <SectionHeading
                    eyebrow="Course Details"
                    title={<>What makes this training <em className="text-terra">work</em></>}
                    sub="Open each note for a deeper explanation of the method, course rhythm and student outcomes."
                  />
                </Reveal>
                <div className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
                  {deepDiveItems.map((item, i) => (
                    <Reveal key={item.title} delay={i * 0.05}>
                      <button
                        type="button"
                        onClick={() => setSelectedDeepDive(item)}
                        className="group grid w-full gap-5 py-7 text-left transition hover:bg-white/60 md:grid-cols-[0.16fr_0.34fr_1fr_auto] md:items-start md:px-4"
                      >
                        <span className="number-value text-2xl text-warm-dark md:text-3xl">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <span className="label-caps text-terra">{item.kicker}</span>
                          <span className="mt-3 block display-sm text-warm-dark">{item.title}</span>
                        </span>
                        <span className="text-sm leading-7 text-warm-mid md:text-base md:leading-8">
                          {item.intro}
                        </span>
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-stone-300 bg-white text-warm-dark transition group-hover:border-terra group-hover:bg-terra group-hover:text-white">
                          <ArrowUpRight className="h-5 w-5" />
                        </span>
                      </button>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}

          {isTwoHundredHour && (
            <section className="py-14 md:py-16 bg-[#F7F4EF]">
              <div className="container-wide">
                <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
                  <Reveal>
                    <div className="overflow-hidden rounded-[10px] bg-white shadow-[0_14px_40px_rgba(31,28,23,0.08)] ring-1 ring-stone-200">
                      <img
                        src={IMG.course200}
                        alt="200-hour yoga teacher training practice in Bali"
                        className="aspect-[16/11] w-full object-cover"
                      />
                      <div className="p-6">
                        <p className="label-caps text-sage">Best fit</p>
                        <h2 className="display-md mt-3 text-warm-dark">Built for serious beginners and future teachers</h2>
                        <p className="mt-4 text-sm leading-7 text-warm-mid">
                          A complete 200-hour pathway for students who want disciplined practice, practical teaching skill and a clear foundation before sharing yoga with others.
                        </p>
                      </div>
                    </div>
                  </Reveal>

                  <div className="grid gap-5 md:grid-cols-2">
                    <Reveal delay={0.08}>
                      <div className="h-full rounded-[10px] border border-stone-200 bg-white p-6 shadow-sm">
                        <GraduationCap className="h-6 w-6 text-terra" />
                        <h3 className="display-sm mt-4 text-warm-dark">This course is for</h3>
                        <ul className="mt-5 space-y-3">
                          {twoHundredBestFor.map((item) => (
                            <li key={item} className="flex gap-3 text-sm leading-6 text-warm-mid">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Reveal>
                    <Reveal delay={0.16}>
                      <div className="h-full rounded-[10px] border border-stone-200 bg-white p-6 shadow-sm">
                        <Award className="h-6 w-6 text-terra" />
                        <h3 className="display-sm mt-4 text-warm-dark">By graduation</h3>
                        <ul className="mt-5 space-y-3">
                          {twoHundredOutcomes.map((item) => (
                            <li key={item} className="flex gap-3 text-sm leading-6 text-warm-mid">
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Reveal>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section id="curriculum" className="py-14 md:py-16 bg-cream scroll-mt-28">
            <div className="container-wide">
              <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
                <Reveal>
                  <div className="lg:sticky lg:top-28">
                    <p className="label-caps text-sage">Curriculum</p>
                    <h2 className="display-lg mt-3 text-warm-dark">
                      {detail.curriculumTitle}
                    </h2>
                    <p className="body-lg mt-5 text-warm-mid">
                      The training moves from physical foundations into teaching practice, philosophy, breathwork and basic anatomy so students leave with a usable structure, not only theory.
                    </p>
                    <img
                      src={detail.image}
                      alt={detail.eyebrow}
                      className="mt-8 aspect-[16/10] w-full rounded-2xl object-cover shadow-sm"
                    />
                  </div>
                </Reveal>

                <Accordion type="single" collapsible defaultValue="curriculum-1" className="space-y-3">
                  {detail.curriculum.map((item, i) => {
                    const points = getCurriculumPoints(course.slug, item.title, item.points);
                    return (
                      <Reveal key={item.title} delay={i * 0.05}>
                        <AccordionItem
                          value={`curriculum-${i + 1}`}
                          className="overflow-hidden rounded-[10px] border border-stone-200 bg-white px-0 shadow-[0_12px_35px_rgba(34,29,24,0.05)]"
                        >
                          <AccordionTrigger className="px-5 py-5 text-left hover:no-underline md:px-6">
                            <div className="flex items-center gap-5">
                              <span className="number-value text-sm text-stone-400">{String(i + 1).padStart(2, "0")}</span>
                              <span className="text-[1.05rem] font-semibold leading-snug text-warm-dark md:text-[1.18rem]">{item.title}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-5 pb-6 md:px-6">
                            <div className="border-t border-stone-100 pt-5">
                              <p className="text-[0.98rem] leading-8 text-warm-mid">{item.desc}</p>
                              <ul className="mt-5 space-y-2.5">
                                {points.map((point) => (
                                  <li key={point} className="flex gap-3 text-[0.95rem] leading-7 text-warm-mid">
                                    <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-terra" />
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Reveal>
                    );
                  })}
                </Accordion>
              </div>
            </div>
          </section>

          {isTwoHundredHour && (
            <section id="roadmap" className="py-14 md:py-16 bg-white scroll-mt-28">
              <div className="container-wide">
                <Reveal>
                  <SectionHeading
                    eyebrow="21-Day Progression"
                    title={<>From Practice to <em className="text-terra">Teaching</em></>}
                    sub="The immersion is structured in phases so students first stabilize personal practice, then learn technique, then teach with support."
                  />
                </Reveal>
                <div className="mt-9 grid gap-5 lg:grid-cols-4">
                  {twoHundredRoadmap.map((phase, i) => (
                    <Reveal key={phase.phase} delay={i * 0.07}>
                      <div className="h-full rounded-[10px] border border-stone-200 bg-cream p-5 shadow-sm">
                        <p className="label-caps text-terra">{phase.phase}</p>
                        <h3 className="display-sm mt-3 text-warm-dark">{phase.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-warm-mid">{phase.desc}</p>
                        <ul className="mt-5 space-y-2">
                          {phase.points.map((point) => (
                            <li key={point} className="flex gap-2 text-xs font-medium leading-5 text-warm-mid">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section id="schedule" className="py-14 md:py-16 bg-white scroll-mt-28">
            <div className="container-wide">
              <Reveal>
                <SectionHeading
                  eyebrow="Daily Rhythm"
                  title={<>Training Day <em className="text-terra">Flow</em></>}
                  sub="A compact daily structure keeps the course focused while still leaving space for meals, recovery and integration."
                />
              </Reveal>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {detail.schedule.map((item, i) => (
                  <Reveal key={item.title} delay={i * 0.05}>
                    <div className="rounded-2xl border border-warm-light/40 bg-cream p-5">
                      <span className="label-caps text-terra">{item.time}</span>
                      <h3 className="display-sm mt-3 text-warm-dark">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-warm-mid">{item.desc}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {isTwoHundredHour && (
            <section id="teaching-lab" className="py-14 md:py-16 bg-cream scroll-mt-28">
              <div className="container-wide">
                <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
                  <Reveal>
                    <div className="lg:sticky lg:top-28">
                      <p className="label-caps text-sage">Teaching Lab</p>
                      <h2 className="display-lg mt-3 text-warm-dark">
                        Learn to teach, not only to memorize sequences
                      </h2>
                      <p className="body-lg mt-5 text-warm-mid">
                        The strongest part of a 200-hour training is the shift from doing yoga to communicating yoga clearly through voice, timing, observation and grounded class design.
                      </p>
                      <div className="mt-7 overflow-hidden rounded-[10px] bg-warm-dark">
                        <img
                          src={IMG.classMain}
                          alt="Teaching practice during yoga teacher training"
                          className="aspect-[16/10] w-full object-cover opacity-90"
                        />
                      </div>
                    </div>
                  </Reveal>
                  <div className="grid gap-4">
                    {twoHundredTeachingLabs.map((lab, i) => {
                      const Icon = lab.icon;
                      return (
                        <Reveal key={lab.title} delay={i * 0.08}>
                          <div className="rounded-[10px] border border-stone-200 bg-white p-6 shadow-sm">
                            <div className="flex gap-4">
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sage/10 text-sage">
                                <Icon className="h-5 w-5" />
                              </span>
                              <div>
                                <h3 className="display-sm text-warm-dark">{lab.title}</h3>
                                <p className="mt-2 text-sm leading-7 text-warm-mid">{lab.desc}</p>
                              </div>
                            </div>
                          </div>
                        </Reveal>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8 grid gap-5 md:grid-cols-3">
                  {twoHundredTrustBlocks.map((block, i) => {
                    const Icon = block.icon;
                    return (
                      <Reveal key={block.title} delay={i * 0.08}>
                        <div className="h-full rounded-[10px] border border-stone-200 bg-white p-6 shadow-sm">
                          <Icon className="h-6 w-6 text-terra" />
                          <h3 className="display-sm mt-4 text-warm-dark">{block.title}</h3>
                          <p className="mt-3 text-sm leading-7 text-warm-mid">{block.desc}</p>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <section className="bg-[#F7F4EF] py-10 md:py-12">
            <div className="container-wide">
              <Reveal>
                <SectionHeading
                  eyebrow="Included Experiences"
                  title={<>Bali Culture & <em className="text-terra">Integration</em></>}
                />
              </Reveal>
              <div className="mt-7 grid gap-8 md:grid-cols-3">
                {detail.activities.map((item, i) => (
                  <Reveal key={item.title} delay={i * 0.08}>
                    <Link href={`/activities#${toActivitySlug(item.title)}`} className="group block">
                      <div className="overflow-hidden rounded-[6px] bg-stone-200 shadow-[0_14px_35px_rgba(31,28,23,0.08)]">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                          onError={(event) => {
                            event.currentTarget.src = IMG.classMain;
                          }}
                        />
                      </div>
                      <div className="pt-4">
                        <p className="label-caps mb-2 text-stone-400">
                          {["Ceremony", "Ceremony", "Workshop"][i] || "Experience"}
                        </p>
                        <h3 className="display-sm text-warm-dark">{item.title}</h3>
                        <p className="mt-2 max-w-sm text-[0.92rem] leading-6 text-warm-mid">{item.desc}</p>
                        <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-terra">
                          View activity details
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          <section id="fees" className="py-14 md:py-16 bg-white scroll-mt-28">
            <div className="container-wide">
              <Reveal>
                <SectionHeading
                  eyebrow="Fees & Deposit"
                  title={detail.pricingTitle}
                  sub={detail.pricingSub}
                />
              </Reveal>
              <div className="mt-8 grid gap-5 lg:grid-cols-3">
                {detail.pricing.map((tier, i) => (
                  <Reveal key={tier.name} delay={i * 0.08}>
                    <div className={`h-full rounded-2xl border bg-cream p-6 ${tier.featured ? "border-terra shadow-lg" : "border-warm-light/40"}`}>
                      {tier.featured && <Badge className="mb-4 bg-terra text-white">Popular</Badge>}
                      <h3 className="display-sm text-warm-dark">{tier.name}</h3>
                      <div className="mt-4 flex items-end gap-3">
                        <span className="text-sm text-warm-mid line-through">{tier.was}</span>
                        <span className="price-value text-terra">{tier.price}</span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-warm-mid">{tier.desc}</p>
                      <ul className="mt-5 space-y-3">
                        {tier.included.map((item) => (
                          <li key={item} className="flex gap-3 text-sm text-warm-mid">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Accommodation */}
      <section className="bg-[#F7F4EF] py-12 md:py-14">
        <div className="container-wide">
          <Reveal>
            <SectionHeading
              eyebrow="Accommodation"
              title={<>Stay in <em className="text-terra">Paradise</em></>}
              sub="Simple, comfortable villa stays on campus with the essentials students need during an intensive training."
            />
          </Reveal>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal>
              <div className="relative h-full min-h-[360px] overflow-hidden rounded-[10px] bg-warm-dark shadow-[0_20px_55px_rgba(31,28,23,0.16)]">
                <img
                  src={IMG.studioPoolDrone}
                  alt="Bali YTTC campus drone view"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-7">
                  <p className="label-caps text-white/70">Campus Setting</p>
                  <h3 className="display-md mt-3 text-white">Villas, yoga studio and pool in one quiet Ubud sanctuary</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/78">
                    Students stay close to the training hall, meals and community spaces so the daily rhythm stays focused and easy.
                  </p>
                </div>
              </div>
            </Reveal>

            <div className="grid gap-5">
            {accommodationTiers.map((tier, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className={`overflow-hidden rounded-[10px] border bg-white shadow-sm ${tier.featured ? "border-terra" : "border-stone-200"}`}>
                  <div className="grid gap-0 sm:grid-cols-[0.9fr_1.1fr]">
                    <div className="relative min-h-[190px] bg-stone-200">
                      <img
                        src={tier.image}
                        alt={tier.name}
                        className="h-full w-full object-cover"
                      />
                      {tier.featured && (
                        <Badge className="absolute left-4 top-4 bg-terra text-white">Private upgrade</Badge>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="label-caps text-sage">{tier.featured ? "Optional Upgrade" : "Course Stay"}</p>
                      <div className="mt-3 flex items-start justify-between gap-4">
                        <h3 className="display-sm text-warm-dark">{tier.name}</h3>
                        <p className="shrink-0 text-right text-[1.25rem] font-semibold leading-none text-terra">{tier.price}</p>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-warm-mid">{tier.desc}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {tier.features.map((feature) => (
                          <span key={feature} className="rounded-full border border-sage/20 bg-sage/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-sage">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {accommodationGallery.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.05}>
                <div className="group overflow-hidden rounded-[10px] bg-white shadow-sm ring-1 ring-stone-200">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="px-4 py-3">
                    <p className="label-caps text-warm-mid">{item.title}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Batches */}
      {availableBatches.length > 0 && (
        <section id="batches" className="py-16 bg-cream">
          <div className="container-wide">
            <Reveal>
              <SectionHeading eyebrow="Upcoming Dates" title={<>Start Your <em className="text-terra">Journey</em></>} />
            </Reveal>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {availableBatches.map((batch, i) => (
                <Reveal key={batch.id} delay={i * 0.1}>
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-warm-light/20">
                    <div className="flex items-center gap-2 text-sm text-warm-mid mb-4">
                      <CalendarDays className="w-4 h-4" />
                      {new Date(batch.startDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </div>
                    <p className="display-sm mb-2 text-warm-dark">{batch.name}</p>
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="text-warm-mid">{batch.enrolled}/{batch.capacity} enrolled</span>
                      <span className="price-value text-terra">EUR {batch.priceRegular}</span>
                    </div>
                    <ApplyModal
                      trigger={<Button className="w-full bg-terra hover:bg-terra-deep text-white">Apply for This Batch</Button>}
                      defaultCourse={course.slug}
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {detail && (
        <section className="py-14 md:py-16 bg-white">
          <div className="container-wide">
            <Reveal>
              <SectionHeading eyebrow={detail.faqEyebrow} title={<>Common <em className="text-terra">Questions</em></>} />
            </Reveal>
            <div className="mx-auto mt-8 max-w-3xl">
              <Accordion type="single" collapsible className="space-y-4">
                {detail.faqs.map((faq, i) => (
                  <AccordionItem key={faq.q} value={`faq-${i}`} className="rounded-2xl border border-warm-light/40 bg-cream px-6">
                    <AccordionTrigger className="display-sm text-left text-warm-dark hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="pb-4 text-sm leading-7 text-warm-mid">{faq.a}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-terra to-terra-deep text-white">
        <div className="container-wide text-center">
          <Reveal>
            <h2 className="display-lg mb-4">Ready to Transform Your Life?</h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of students who have completed their yoga teacher training in Bali.
            </p>
            <ApplyModal
              trigger={<Button size="lg" className="bg-white text-terra hover:bg-white/90">Apply Now</Button>}
              defaultCourse={course.slug}
            />
          </Reveal>
        </div>
      </section>

      <Dialog open={!!selectedDeepDive} onOpenChange={(open) => !open && setSelectedDeepDive(null)}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto border-stone-200 bg-cream p-0">
          {selectedDeepDive && (
            <div>
              <div className="border-b border-stone-200 bg-white p-6 md:p-8">
                <p className="label-caps text-terra">{selectedDeepDive.kicker}</p>
                <DialogTitle className="mt-3 font-sans text-2xl font-bold leading-tight text-warm-dark md:text-3xl">
                  {selectedDeepDive.title}
                </DialogTitle>
                <DialogDescription className="mt-4 text-base leading-8 text-warm-mid">
                  {selectedDeepDive.intro}
                </DialogDescription>
              </div>
              <div className="p-6 md:p-8">
                <p className="text-base leading-8 text-warm-mid">{selectedDeepDive.details}</p>
                <div className="mt-7 grid gap-6 md:grid-cols-[1fr_0.85fr]">
                  <div className="rounded-[10px] border border-stone-200 bg-white p-5">
                    <h3 className="label-caps mb-4 text-sage">What you study</h3>
                    <ul className="space-y-3">
                      {selectedDeepDive.points.map((point) => (
                        <li key={point} className="flex gap-3 text-sm leading-6 text-warm-mid">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-[10px] bg-warm-dark p-5 text-white">
                    <h3 className="label-caps mb-4 text-orange-200">Student impact</h3>
                    <p className="text-sm leading-7 text-white/78">{selectedDeepDive.impact}</p>
                  </div>
                </div>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <ApplyModal
                    trigger={<Button className="bg-terra text-white hover:bg-terra-deep">Apply for this course</Button>}
                    defaultCourse={course.slug}
                  />
                  <Link href="#curriculum" onClick={() => setSelectedDeepDive(null)}>
                    <Button variant="outline" className="border-sage/30 text-sage hover:bg-sage hover:text-white">
                      View curriculum
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CoursePage;
