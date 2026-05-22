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
import { Check, X, CalendarDays, Clock, MapPin, Users, Loader2 } from "lucide-react";

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
      "A focused 6-day short yoga teacher training in Ubud for beginners who want a practical foundation in traditional Hatha, Vinyasa flow, breathwork, alignment and teaching basics.",
    description:
      "This 50-hour Hatha-Vinyasa training is a compact foundation course for students new to yoga or anyone wanting to deepen traditional practice in a short format. The course introduces asana, sun salutations, basic sequencing, alignment, pranayama, meditation, anatomy and beginner teaching practice in a supportive Bali setting.",
    image:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:1080/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/09/50-hour-hatha-vinyasa-yoga-teacher-training-1.jpg",
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
        desc: "Learn warm-ups, sun salutations, foundational postures and basic Vinyasa flow structure.",
        points: ["Pawanmuktasana warm-up", "Hatha sun salutation", "Vinyasa flow variations"],
      },
      {
        title: "Asana Concepts",
        desc: "Understand posture categories, effects, benefits and how different styles impact body and mind.",
        points: ["Posture families", "Benefits and effects", "Safe practice basics"],
      },
      {
        title: "Alignment & Modification",
        desc: "Refine your understanding of asana through basic alignment, posture anatomy and student-friendly modifications.",
        points: ["Anatomy of posture", "Alignment principles", "Modifications and props"],
      },
      {
        title: "Teaching Practice",
        desc: "Start practicing from day one with simple cueing, class structure and supervised teaching drills.",
        points: ["Basic cueing", "Short class structure", "Feedback from teachers"],
      },
      {
        title: "Hands-on Adjustments",
        desc: "Learn the art of safe, respectful beginner-level adjustment and observation.",
        points: ["Consent-based touch", "Simple assists", "Observation skills"],
      },
      {
        title: "Mantra, Meditation & Pranayama",
        desc: "Build a daily inner practice through breathwork, meditation methods and mantra chanting.",
        points: ["Pranayama techniques", "Meditation basics", "Mantra practice"],
      },
      {
        title: "Anatomy Basics",
        desc: "Study key body systems and how asana, pranayama and meditation support wellbeing.",
        points: ["Skeletal system", "Muscular system", "Respiratory and digestive basics"],
      },
    ],
    schedule: [
      { time: "Morning", title: "Mantra, Pranayama & Asana", desc: "Start the day with breath, cleansing and guided Hatha-Vinyasa practice." },
      { time: "Breakfast", title: "Plant-Based Meal", desc: "A nourishing meal before theory and teaching work." },
      { time: "Late Morning", title: "Philosophy & Anatomy", desc: "Simple foundations of yoga theory and body awareness." },
      { time: "Lunch", title: "Rest & Integration", desc: "A short break for food, notes and recovery." },
      { time: "Afternoon", title: "Alignment, Adjustment & Teaching", desc: "Hands-on learning, cueing practice and basic sequencing." },
      { time: "Evening", title: "Asana, Meditation & Dinner", desc: "Closing movement, meditation and dinner." },
    ],
    activities: [
      {
        title: "Acro Yoga Introduction",
        desc: "A playful beginner workshop for balance, trust and partner awareness.",
        image: IMG.acroYoga,
      },
      {
        title: "Balinese Welcome",
        desc: "A soft cultural entry into the Bali YTTC community and Ubud training rhythm.",
        image:
          "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:864/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Balinese-Welcome-Ceremony-for-YTT.jpg",
      },
      {
        title: "Ubud Practice Setting",
        desc: "Train in a peaceful yoga environment surrounded by nature, suitable for focused short immersion.",
        image:
          "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:1080/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/09/Yoga-training-in-Bali.jpg",
      },
    ],
    pricing: [
      {
        name: "Tuition Only",
        was: "EUR 699",
        price: "EUR 499",
        desc: "Short-course training package for students arranging their own stay.",
        included: ["Hatha and Vinyasa practice", "Training equipment", "Foundation certificate"],
      },
      {
        name: "Shared Stay",
        was: "EUR 999",
        price: "EUR 799",
        desc: "Six-day short course with meals and shared accommodation included.",
        included: ["6 days meals and stay", "Course materials", "Daily training sessions"],
        featured: true,
      },
      {
        name: "Private Room",
        was: "EUR 1199",
        price: "EUR 999",
        desc: "Private room package for students who want a quieter short immersion.",
        included: ["Private accommodation", "Meals and training", "Beginner workshops"],
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
    pricingSub: "Reserve the course with a EUR 300 deposit. Early-bird rates can be switched from admin later when seasonal pricing is final.",
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
        a: "A EUR 300 deposit secures your place. If your travel plan changes, the booking can be rescheduled according to the school policy.",
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
    pricingSub: "Reserve your place with a EUR 300 deposit. Final seasonal and early-bird pricing can remain admin-controlled.",
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

const CoursePage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCourse = useCallback(async () => {
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
  }, [params?.locale, router, slug]);

  useEffect(() => {
    if (slug) {
      void fetchCourse();
    }
  }, [fetchCourse, slug]);

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
  const pageCourse = detail
    ? {
        ...course,
        name: detail.name,
        summary: detail.summary,
        description: detail.description,
        image: detail.image,
      }
    : course;
  const displayPriceFrom = course.slug === "100hr" ? 699 : course.priceFrom;

  return (
    <>
      {/* Hero */}
      <section className="relative pt-40 pb-20 md:pt-48 md:pb-28 overflow-hidden bg-warm-dark">
        <div className="absolute inset-0">
          <img src={pageCourse.image} alt={pageCourse.name} className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-r from-warm-dark/90 to-warm-dark/60" />
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
          </div>
        </div>
      </section>

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

          <section className="py-14 md:py-16 bg-cream">
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
                              <span className="font-serif text-sm text-stone-400">{String(i + 1).padStart(2, "0")}</span>
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

          <section className="py-14 md:py-16 bg-white">
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
                    <div className="group">
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
                          {["Ceremony", "Nature", "Practice"][i] || "Experience"}
                        </p>
                        <h3 className="display-sm text-warm-dark">{item.title}</h3>
                        <p className="mt-2 max-w-sm text-[0.92rem] leading-6 text-warm-mid">{item.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          <section className="py-14 md:py-16 bg-white">
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
    </>
  );
};

export default CoursePage;
