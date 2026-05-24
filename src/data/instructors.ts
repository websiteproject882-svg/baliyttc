import { IMG } from "./site";

export const instructors = [
  {
    slug: "vivek-kalura",
    name: "Vivek Kalura",
    title: "Lead Teacher & Founder",
    credential: "MSc in Yogic Science",
    experience: "15+ years",
    photo: IMG.vivek,
    specializations: ["Hatha", "Ashtanga", "Vinyasa", "Yoga Therapy", "Philosophy", "Pranayama"],
    bio:
      "Vivek founded Bali YTTC with a vision to keep yoga authentic, grounded in classical lineage while accessible to international students. Trained in the Himalayan tradition with a Master's in Yogic Science, he teaches the unity of body, mind and soul through precision alignment and philosophical depth.",
  },
  {
    slug: "sachin-rautela",
    name: "Sachin Rautela",
    title: "Senior Teacher",
    credential: "E-RYT 500, Yoga Acharya",
    experience: "15+ years",
    photo: IMG.sachin,
    specializations: ["Ashtanga", "Vinyasa", "Alignment", "Adjustments"],
    bio:
      "Sachin brings the discipline of traditional Ashtanga into every class: precise, safe and deeply respectful of the lineage. As an E-RYT 500 registered teacher, he specializes in intelligent sequencing and hands-on adjustments that build lasting practice foundations.",
  },
  {
    slug: "yuli-hanurawati",
    name: "Mrs. Yuli Hanurawati",
    title: "Vinyasa & Sound Specialist",
    credential: "Senior Instructor, ERYT-500",
    experience: "15+ years",
    photo: IMG.yuli,
    specializations: ["Vinyasa", "Yin Yoga", "Sound Healing", "Meditation"],
    bio:
      "Yuli brings Balinese warmth and a deep reverence for sound into her teaching. As our resident sound healing guide, she leads transformative sessions with Tibetan bowls alongside fluid Vinyasa and Yin practices rooted in Balinese spiritual tradition.",
  },
  {
    slug: "sandeep-ji",
    name: "Sandeep Ji",
    title: "Philosophy Master",
    credential: "Masters in Yoga (Yogic Science)",
    experience: "10+ years",
    photo: IMG.sandeep,
    specializations: ["Philosophy", "Meditation", "Sanskrit", "Classical Pranayama"],
    bio:
      "Sandeep bridges the ancient texts of the Yoga Sutras and Bhagavad Gita with practical daily life. His lectures are known for making complex philosophy accessible, and students often describe his classes as one of the most transformative parts of training.",
  },
];

export function getInstructor(slug: string) {
  return instructors.find((instructor) => instructor.slug === slug);
}
