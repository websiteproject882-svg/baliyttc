export type StaticBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  readTime: number;
  sourceUrl: string;
};

export const STATIC_BLOG_POSTS: StaticBlogPost[] = [
  {
    id: "static-blog-ryt-certification-guide",
    title: "Yoga Teacher Certification Guide: What RYT 200, RYT 500, E-RYT, RCYT, and RPYT Really Mean",
    slug: "yoga-teacher-certification-guide-ryt-200-ryt-500-e-ryt-rcyt-rpyt",
    excerpt:
      "A clear guide to the Yoga Alliance certification terms students often see when comparing teacher training programs.",
    content:
      "Yoga teacher certification can feel confusing at first because training hours, school registration, teacher credentials, and specialty pathways are often mixed together.\n\nRYT 200 is the usual first professional credential after completing a 200-hour Yoga Alliance registered training. RYT 500 normally means the teacher has completed advanced study beyond the first 200 hours, often through a 300-hour advanced program. E-RYT signals teaching experience after certification, while RCYT and RPYT relate to children's yoga and prenatal yoga specialties.\n\nFor students choosing a Bali training, the most important step is to confirm that the school is registered, the curriculum includes practice and teaching methodology, and the certificate supports your long-term teaching goals.",
    featuredImage:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:820/h:460/q:mauto/rt:fill/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2026/05/ChatGPT-Image-May-5-2026-07_22_00-PM.png",
    category: "Certification",
    tags: ["Yoga Alliance", "RYT 200", "RYT 500", "Teacher Training"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-05-05T00:00:00.000Z",
    readTime: 6,
    sourceUrl:
      "https://baliyttc.com/yoga-teacher-certification-guide-what-ryt-200-ryt-500-e-ryt-rcyt-and-rpyt-really-mean/",
  },
  {
    id: "static-blog-yoga-teacher-training-bali",
    title: "Yoga Teacher Training in Bali: Master Teaching with Yoga",
    slug: "yoga-teacher-training-in-bali-master-teaching-with-yoga",
    excerpt:
      "Why Bali is one of the strongest destinations for students who want immersive practice, certification, and teaching confidence.",
    content:
      "Yoga teacher training in Bali gives students more than a certificate. The setting supports deep daily practice, steady routine, and a clear break from the distractions of normal life.\n\nA strong training should combine asana, pranayama, meditation, anatomy, philosophy, teaching methodology, sequencing, and real practice teaching. Students should leave with the confidence to guide a class, not only perform postures.\n\nAt Bali YTTC, the goal is to help students understand yoga as a complete discipline: physical, mental, philosophical, and practical. The best training experience is structured, residential, and supported by teachers who can correct, guide, and mentor each student directly.",
    featuredImage:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:820/h:460/q:mauto/rt:fill/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2026/04/ChatGPT-Image-Apr-26-2026-11_57_58-AM.png",
    category: "Yoga Teacher Training",
    tags: ["Bali YTTC", "200 Hour YTT", "Teaching Methodology", "Ubud"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-04-28T00:00:00.000Z",
    readTime: 7,
    sourceUrl: "https://baliyttc.com/yoga-teacher-training-in-bali-master-teaching-with-bali-yttc/",
  },
  {
    id: "static-blog-beginner-yoga-guide",
    title: "Your Complete Beginner Yoga Guide to Confident Practice",
    slug: "complete-beginner-yoga-guide-confident-practice",
    excerpt:
      "A practical starting point for new students who want to begin yoga safely, consistently, and without pressure.",
    content:
      "Beginner yoga is for every age, body type, and flexibility level. The first goal is not advanced posture. The first goal is awareness, breath, consistency, and learning how your body moves.\n\nStart with simple standing poses, seated stretches, gentle twists, breath awareness, and short relaxation. Practice slowly enough that you can notice alignment and avoid forcing the body.\n\nA good beginner routine should feel sustainable. Ten to twenty minutes daily can build more confidence than one intense class each week. With time, strength, mobility, balance, and focus improve naturally.",
    featuredImage:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:820/h:460/q:mauto/rt:fill/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2026/04/Yoga-for-beginners-at-bali-yttc.jpg",
    category: "Yoga Practice",
    tags: ["Beginner Yoga", "Practice", "Alignment", "Breath"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-04-25T00:00:00.000Z",
    readTime: 5,
    sourceUrl: "https://baliyttc.com/your-complete-beginner-yoga-guide-to-confident-practice/",
  },
  {
    id: "static-blog-morning-evening-yoga",
    title: "Morning vs. Evening Yoga: Which Time is Best for Your Practice?",
    slug: "morning-vs-evening-yoga-best-time-for-practice",
    excerpt:
      "Morning and evening yoga both work well. The right choice depends on your energy, schedule, and practice intention.",
    content:
      "Morning yoga can create clarity, discipline, and energy for the day. It is often best for pranayama, meditation, sun salutations, and steady asana practice before daily responsibilities begin.\n\nEvening yoga can help release stress, calm the nervous system, and prepare the body for rest. Slower flows, hip openers, forward folds, and breathwork usually work well later in the day.\n\nThe best time is the time you can maintain consistently. Some students use morning practice for strength and evening practice for recovery. What matters most is that the practice supports your life rather than becoming another pressure.",
    featuredImage:
      "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:820/h:460/q:mauto/rt:fill/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2026/04/ChatGPT-Image-Apr-23-2026-06_21_50-PM.png",
    category: "Yoga Practice",
    tags: ["Morning Yoga", "Evening Yoga", "Routine", "Wellness"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-04-23T00:00:00.000Z",
    readTime: 5,
    sourceUrl: "https://baliyttc.com/morning-vs-evening-yoga-which-time-is-best-for-your-practice/",
  },
  {
    id: "static-blog-100-hour-ytt-bali",
    title: "100-Hour Yoga Teacher Training in Bali: A Clear Foundation Path",
    slug: "100-hour-yoga-teacher-training-in-bali-foundation-path",
    excerpt:
      "A practical overview of the 100-hour Bali YTTC immersion for students who want a compact but serious start.",
    content:
      "The 100-hour yoga teacher training is designed for students who want a focused first immersion before committing to a longer 200-hour course. It introduces the main pillars of yoga education: asana, pranayama, meditation, philosophy, anatomy and introductory teaching practice.\n\nStudents train in Hatha, Ashtanga and Vinyasa foundations while learning how to practise safely and understand posture alignment. The course also includes Balinese cultural integration, guided breathwork and practical teaching exercises.\n\nThis path works well for beginners, returning practitioners and students who want to split their training journey into smaller stages.",
    featuredImage: "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:1080/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/09/100-hour-Yoga-Teacher-Training-Vinyasa-class-in-Bali.jpg",
    category: "Teacher Training",
    tags: ["100 Hour YTT", "Bali", "Foundation", "Yoga Alliance"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-04-18T00:00:00.000Z",
    readTime: 6,
    sourceUrl: "https://baliyttc.com/100-hour-ytt-in-bali/",
  },
  {
    id: "static-blog-200-hour-ytt-bali",
    title: "200-Hour Yoga Teacher Training in Bali: What Students Actually Study",
    slug: "200-hour-yoga-teacher-training-in-bali-what-students-study",
    excerpt:
      "A detailed guide to the 21-day Hatha, Ashtanga and Vinyasa training pathway at Bali YTTC.",
    content:
      "The 200-hour YTT is the main foundation pathway for students who want to teach yoga professionally. A strong course should include daily asana practice, pranayama, meditation, applied anatomy, yoga philosophy, teaching methodology, sequencing and supervised teaching practice.\n\nAt Bali YTTC, students learn Hatha for structure, Ashtanga for discipline and Vinyasa for creative flow. The training also includes alignment labs, adjustments, mantra, Ayurveda introduction and practical feedback so students can build confidence in front of real people.\n\nThe goal is not only to finish hours. The goal is to leave with a teaching voice, a clear class structure and a deeper relationship with practice.",
    featuredImage: "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:1080/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/200-hour-Yoga-Teacher-Training-for-Beginners.jpg",
    category: "Teacher Training",
    tags: ["200 Hour YTT", "Hatha", "Ashtanga", "Vinyasa"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-04-15T00:00:00.000Z",
    readTime: 8,
    sourceUrl: "https://baliyttc.com/200-hour-ytt-in-bali/",
  },
  {
    id: "static-blog-300-hour-ytt-bali",
    title: "300-Hour Advanced Yoga Teacher Training in Bali: The RYT-500 Direction",
    slug: "300-hour-advanced-yoga-teacher-training-in-bali-ryt-500-direction",
    excerpt:
      "How the 300-hour training helps certified teachers deepen practice, sequencing, philosophy and mentorship.",
    content:
      "The 300-hour training is for graduates who already have a 200-hour foundation and want to move into deeper professional study. The work becomes more refined: advanced asana, intelligent sequencing, subtle body study, yoga therapy foundations, advanced pranayama and teaching mentorship.\n\nStudents learn how to adapt yoga for different bodies, build advanced class arcs and communicate with more confidence. The training also gives space for deeper self-practice and philosophical reflection.\n\nFor many teachers, this course becomes the next step toward a 500-hour professional pathway and a more mature teaching presence.",
    featuredImage: "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:700/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Yoga-Retreat-in-Bali.jpg",
    category: "Teacher Training",
    tags: ["300 Hour YTT", "Advanced Yoga", "RYT 500", "Mentorship"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-04-12T00:00:00.000Z",
    readTime: 7,
    sourceUrl: "https://baliyttc.com/300-hour-ytt-in-bali/",
  },
  {
    id: "static-blog-50-hour-hatha-vinyasa-ytt",
    title: "50-Hour Hatha Vinyasa Yoga Teacher Training in Bali",
    slug: "50-hour-hatha-vinyasa-yoga-teacher-training-in-bali",
    excerpt:
      "A short, practical Bali training for students who want Hatha and Vinyasa foundations without a full-month commitment.",
    content:
      "The 50-hour Hatha Vinyasa training is a compact short course for students who want structure, technique and practice without joining a full 100-hour or 200-hour immersion. It focuses on foundational postures, breath-led movement, basic sequencing and simple teaching confidence.\n\nStudents study Hatha alignment, Vinyasa flow, pranayama, meditation and introductory teaching methodology. It is a useful choice for beginners, retreat students and practitioners who want a practical foundation in a shorter time.\n\nThe course can also become a stepping stone toward longer training later.",
    featuredImage: "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:1080/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/09/50-hour-hatha-vinyasa-yoga-teacher-training-1.jpg",
    category: "Teacher Training",
    tags: ["50 Hour YTT", "Hatha", "Vinyasa", "Short Course"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-04-10T00:00:00.000Z",
    readTime: 5,
    sourceUrl: "https://baliyttc.com/50-hour-hatha-yoga-teacher-training-in-bali/",
  },
  {
    id: "static-blog-temple-purification-bali",
    title: "Temple Purification in Bali: Why It Matters During Yoga Training",
    slug: "temple-purification-in-bali-yoga-training",
    excerpt:
      "A student-friendly explanation of Balinese water purification and its place in the training experience.",
    content:
      "A Balinese temple purification ceremony is not a performance. It is a cultural and spiritual practice that invites students to slow down, observe respectfully and enter the training with humility.\n\nDuring a yoga teacher training in Bali, this experience helps students understand that practice is not limited to the mat. Ritual, community, gratitude and intention are part of the island's living culture.\n\nStudents are guided on what to wear, how to behave and how to participate respectfully so the experience feels meaningful rather than touristic.",
    featuredImage: "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:864/h:1080/q:eco/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Holy-Temple-purification-in-Bali-1.jpg",
    category: "Bali Experience",
    tags: ["Temple Purification", "Bali Culture", "YTT Activities"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-04-08T00:00:00.000Z",
    readTime: 4,
    sourceUrl: "https://baliyttc.com/",
  },
  {
    id: "static-blog-sound-healing-bali",
    title: "Sound Healing During Yoga Teacher Training in Bali",
    slug: "sound-healing-during-yoga-teacher-training-in-bali",
    excerpt:
      "How sound sessions support rest, nervous system recovery and integration during intensive training.",
    content:
      "Sound healing is often included as a restorative support during intensive yoga training. After long days of practice, anatomy, philosophy and teaching labs, students need time to process physically and mentally.\n\nBowls, vibration and guided rest can help the body downshift. The aim is not entertainment; it is integration. Students learn to notice how sound, stillness and breath affect the nervous system.\n\nFor many students, sound healing becomes one of the most memorable parts of the Bali training rhythm.",
    featuredImage: "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:600/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Sound-Healing-during-our-Yoga-Teacher-Training-in-bali.jpg",
    category: "Bali Experience",
    tags: ["Sound Healing", "Restorative", "Student Life"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-04-06T00:00:00.000Z",
    readTime: 4,
    sourceUrl: "https://baliyttc.com/",
  },
  {
    id: "static-blog-arm-balancing-workshop",
    title: "Arm Balancing Workshop: Building Strength, Trust and Technique",
    slug: "arm-balancing-workshop-strength-trust-technique",
    excerpt:
      "A practical look at how arm balance workshops help students build confidence safely.",
    content:
      "Arm balancing is not only about strength. It teaches leverage, alignment, gaze, breath, patience and the ability to fall safely. In training, students work progressively so the body understands each stage before moving deeper.\n\nA good workshop breaks postures into foundations: wrist care, shoulder stability, core activation, hip position and exit strategy. Students learn how to guide others without pushing them into shapes they are not ready for.\n\nThis is why workshops are valuable in teacher training. They turn difficult-looking poses into teachable, safe progressions.",
    featuredImage: "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:600/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Arm-balancing-workshop-200-hour-YTT.jpg",
    category: "Asana Practice",
    tags: ["Arm Balance", "Workshop", "Alignment"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-04-04T00:00:00.000Z",
    readTime: 4,
    sourceUrl: "https://baliyttc.com/",
  },
  {
    id: "static-blog-acro-yoga-workshop",
    title: "Acro Yoga Workshop in Bali: Trust, Communication and Play",
    slug: "acro-yoga-workshop-in-bali-trust-communication-play",
    excerpt:
      "Why partner practice can help yoga students understand communication, support and confidence.",
    content:
      "Acro Yoga adds playfulness to training while still teaching serious skills. Students practise communication, consent, spotting and trust. These lessons transfer directly into teaching because a yoga teacher must learn to see students clearly and communicate calmly.\n\nThe workshop is usually beginner-friendly and structured around safe progressions. Students learn the roles of base, flyer and spotter while keeping the mood light and cooperative.\n\nIt is a useful reminder that yoga training can be disciplined and joyful at the same time.",
    featuredImage: "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:600/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Acro-Yoga-Workssop-at-bali-YTTC.jpg",
    category: "Bali Experience",
    tags: ["Acro Yoga", "Workshop", "Community"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-04-02T00:00:00.000Z",
    readTime: 4,
    sourceUrl: "https://baliyttc.com/",
  },
  {
    id: "static-blog-beach-yoga-bali",
    title: "Beach Yoga in Bali: Practice Beyond the Studio",
    slug: "beach-yoga-in-bali-practice-beyond-the-studio",
    excerpt:
      "How outdoor practice supports presence, breath and connection during yoga training.",
    content:
      "Beach yoga gives students a different relationship with practice. The surface is less predictable, the air is open and the sound of the ocean encourages breath awareness. This helps students understand yoga as something alive, not only a studio routine.\n\nOutdoor practice also teaches adaptability. A teacher learns to manage space, sound, weather and student comfort while keeping the class grounded.\n\nIn Bali, beach practice becomes a simple but powerful way to connect discipline with nature.",
    featuredImage: "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:600/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Beach-Yoga-at-bali-Yoga-Teacher-Training-Center.jpg",
    category: "Bali Experience",
    tags: ["Beach Yoga", "Bali", "Outdoor Practice"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-03-30T00:00:00.000Z",
    readTime: 4,
    sourceUrl: "https://baliyttc.com/",
  },
  {
    id: "static-blog-pranayama-class-bali",
    title: "Pranayama Class in YTT: Learning the Breath Before Teaching It",
    slug: "pranayama-class-ytt-learning-breath-before-teaching",
    excerpt:
      "Why pranayama needs daily practice, careful guidance and clear teaching language.",
    content:
      "Pranayama is one of the most important parts of yoga teacher training because breath affects energy, attention and the nervous system. Students first learn to practise simple techniques consistently before trying to teach them.\n\nA responsible training explains when to use energising breath, when to use calming breath and when to keep the practice gentle. Students also learn basic contraindications and clear cueing.\n\nThe result is practical confidence: not a list of techniques, but an understanding of how breath supports real students.",
    featuredImage: "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:600/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/09/Pranayama-class-200-hour-YTT.jpg",
    category: "Pranayama",
    tags: ["Pranayama", "Breathwork", "Teaching"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-03-28T00:00:00.000Z",
    readTime: 5,
    sourceUrl: "https://baliyttc.com/",
  },
  {
    id: "static-blog-mandala-meditation",
    title: "Mandala Meditation and Art During Yoga Training",
    slug: "mandala-meditation-and-art-during-yoga-training",
    excerpt:
      "How creative meditation helps students integrate focus, patience and inner reflection.",
    content:
      "Mandala practice combines concentration, creativity and meditation. During training, it gives students a quiet way to process what they are learning. The goal is not artistic perfection. The goal is attention.\n\nDrawing, painting or contemplating a mandala can support patience and mental steadiness. It also helps students experience meditation beyond seated silence.\n\nFor future teachers, this becomes a reminder that yoga tools can be adapted for different personalities and learning styles.",
    featuredImage: "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:600/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Mandala-Meditation-Yoga-Teacher-Training-Bali.png",
    category: "Meditation",
    tags: ["Mandala", "Meditation", "Creative Practice"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-03-26T00:00:00.000Z",
    readTime: 4,
    sourceUrl: "https://baliyttc.com/",
  },
  {
    id: "static-blog-yoga-alliance-certification",
    title: "Yoga Alliance Certification: What Students Should Check Before Booking",
    slug: "yoga-alliance-certification-what-students-should-check-before-booking",
    excerpt:
      "A simple checklist for comparing Yoga Alliance schools, certificates and training quality.",
    content:
      "Before booking a teacher training, students should check whether the school is registered, what level of training is offered, how many contact hours are included and whether teaching practice is part of the curriculum.\n\nA certificate is strongest when it reflects real training: practice, methodology, anatomy, philosophy, assessment and attendance. Students should also confirm what is included in the fee, whether accommodation is optional and how support works after graduation.\n\nGood certification is not only a badge. It is a clear training process that prepares students to teach responsibly.",
    featuredImage: "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:240/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/RYS-200-LOGO.png",
    category: "Certification",
    tags: ["Yoga Alliance", "Certification", "RYT 200"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-03-24T00:00:00.000Z",
    readTime: 5,
    sourceUrl: "https://baliyttc.com/about-us/",
  },
  {
    id: "static-blog-bali-visa-ytt",
    title: "Bali Visa Guide for Yoga Teacher Training Students",
    slug: "bali-visa-guide-for-yoga-teacher-training-students",
    excerpt:
      "A clear planning guide for students travelling to Bali for short and longer yoga programs.",
    content:
      "Visa planning depends on nationality, stay length and whether the student is joining a short course or a full teacher training. Many students use visa-on-arrival options for shorter stays, while longer programs may require more planning.\n\nStudents should check passport validity, entry rules, return ticket expectations and whether an extension is needed. It is also wise to keep accommodation details, school confirmation and travel insurance organised before departure.\n\nBecause rules can change, final visa decisions should be checked before travel. The school can guide students with practical planning notes.",
    featuredImage: "https://ml4wp2nfx5ts.i.optimole.com/cb:JBht.f40/w:600/q:mauto/g:sm/f:best/https://baliyttc.com/wp-content/uploads/2025/08/Bali-YTTC-GRADUATION-CEREMONY-JULY-1.jpg",
    category: "Travel",
    tags: ["Bali Visa", "Travel", "Student Guide"],
    author: "Bali Yoga Teacher Training Center",
    publishedAt: "2026-03-22T00:00:00.000Z",
    readTime: 5,
    sourceUrl: "https://baliyttc.com/",
  },
];

export const findStaticBlogPost = (slug: string) =>
  STATIC_BLOG_POSTS.find((post) => post.slug === slug);
