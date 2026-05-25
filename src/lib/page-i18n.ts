import { defaultLocale, locales, type Locale } from "@/i18n/routing";

type CopyTree = Record<string, unknown>;

export function normalizePageLocale(locale?: string | null): Locale {
  return locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
}

function mergeCopy(base: CopyTree, override: CopyTree): CopyTree {
  const result: CopyTree = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      result[key] = mergeCopy(baseValue as CopyTree, value as CopyTree);
    } else {
      result[key] = value;
    }
  }

  return result;
}

const en = {
  about: {
    story: "Our story",
    heroTitle: "A school built on",
    heroAccent: "lineage,",
    heroSuffix: "love & Bali.",
    heroText:
      "Since 2018, Bali Yoga Teacher Training Center has been guiding seekers from around the world into authentic, multi-style yoga teacher trainings rooted in classical lineage and held in the gentle embrace of Ubud.",
    imageAlt: "Yoga class in Bali",
    philosophyEyebrow: "Our philosophy",
    philosophyTitle: "Yoga is more than",
    philosophyAccent: "asana",
    philosophyText1:
      "We teach yoga as a complete way of life: body, breath, mind and spirit. Our trainings weave together the rigour of Hatha, the heat of Ashtanga, the flow of Vinyasa, and the depth of Yoga philosophy.",
    philosophyText2:
      "We believe a true teacher first becomes a true student. Every cohort is small, every teacher is a senior practitioner, and every day includes time to embody, not just memorise.",
    milestonesEyebrow: "Milestones",
    milestonesTitle: "Our",
    milestonesAccent: "journey",
    milestonesSuffix: "so far",
    statsEyebrow: "By the numbers",
    statsTitle: "A community of",
    statsAccent: "teachers",
    statGraduates: "Graduates",
    statCountries: "Countries",
    statRating: "Google rating",
    statEstablished: "Established",
    milestones: [
      { y: 2018, t: "School founded", d: "Bali YTTC opens its doors in Ubud with our first 200-hour cohort." },
      { y: 2019, t: "Yoga Alliance RYS", d: "Officially registered as a Yoga Alliance school, RYS 200." },
      { y: 2021, t: "100hr & 300hr added", d: "Expanded our programme to welcome beginners and advanced teachers." },
      { y: 2024, t: "1,500+ graduates", d: "Our community of teachers spreads across 60+ countries." },
      { y: 2026, t: "2,500+ & growing", d: "A new ashram wing, more workshops, same lineage." },
    ],
  },
  contact: {
    eyebrow: "Contact admissions",
    title: "Ask anything before you choose your training",
    intro:
      "Need help with course selection, dates, visa, accommodation, payment or airport pickup? Send one clear message and our team will guide you with practical next steps.",
    trustTitle: "No pressure admissions",
    trustText: "You can ask questions first. A seat is reserved only after availability is confirmed and deposit is paid.",
    formTitle: "Send a message",
    formText: "Include your course, preferred month and any travel or payment questions. We usually reply within one business day.",
    fullName: "Full name *",
    email: "Email *",
    phone: "WhatsApp / phone",
    topic: "Topic",
    message: "Message *",
    namePlaceholder: "Your name",
    emailPlaceholder: "you@example.com",
    phonePlaceholder: "+62...",
    messagePlaceholder:
      "Example: I am interested in the 200-hour course in July. Is shared accommodation included? Do I need a visa extension?",
    sending: "Sending...",
    send: "Send message",
    whatsapp: "WhatsApp us",
    successTitle: "Message sent",
    successDesc: "Admissions will reply soon by email or WhatsApp.",
    errorTitle: "Message not sent",
    errorDesc: "Please try WhatsApp if the form does not work.",
    fastestReply: "Fastest reply",
    whatsappAdmissions: "WhatsApp admissions",
    emailLabel: "Email",
    phoneLabel: "Phone",
    emailText: "Course, payment and document questions",
    phoneText: "Call during Bali business hours",
    nextTitle: "What happens after you contact us?",
    steps: [
      "Tell us your preferred course and dates.",
      "Admissions confirms availability and answers questions.",
      "Reserve your seat only when you are ready to pay the deposit.",
    ],
    visitEyebrow: "Visit the school",
    visitTitle: "Find us in Ubud, Bali",
    visitText:
      "Bali YTTC is based in Ubud, surrounded by quiet nature, practice spaces and student accommodation. Ask admissions before visiting so the team can guide you properly.",
    address: "Address",
    hours: "Admissions hours",
    hoursText: "Monday to Saturday, 9:00-19:00 WITA",
    bestTime: "Best time to ask",
    bestTimeText: "Contact 4-8 weeks before your preferred training date.",
    mapTitle: "Bali YTTC location map",
    mapText: "Open the map for directions, traffic and nearby landmarks.",
    directions: "Get directions",
    courseOptions: [
      "General question",
      "50-Hour Hatha Vinyasa YTT",
      "100-Hour Multi-Style YTT",
      "200-Hour Hatha Ashtanga Vinyasa YTT",
      "300-Hour Advanced YTT",
      "Retreats / Workshops",
      "Payment / Visa / Accommodation",
    ],
  },
  schedule: {
    eyebrow: "2026 training calendar",
    title: "Upcoming yoga teacher training dates in Ubud",
    intro:
      "Compare every upcoming batch by course, price and availability. Choose a date, apply online, and our admissions team will confirm your seat before deposit.",
    viewDetails: "View course details",
    to: "to",
    apply: "Apply for this date",
    fewSeats: "Few seats",
    available: "Available",
  },
  activities: {
    backHome: "Back to Home",
    eyebrow: "Yoga Experiences",
    title: "Activities &",
    accent: "Workshops",
    subtitle:
      "Cultural ceremonies, nature visits and practical workshops that help students integrate yoga beyond classroom hours.",
    search: "Search ceremonies, workshops, nature trips...",
    all: "All",
    readDetails: "Read details",
    learnMore: "Learn More",
    notesTitle: "Detailed activity notes",
    notesText:
      "Each experience is part of the training rhythm. The aim is not to fill free time, but to help students understand yoga through culture, trust, creativity, recovery and real-world practice.",
    included: "Included",
    bestFor: "Best For",
    faqEyebrow: "Activity FAQ",
    faqTitle: "Before you join",
    faqText: "Schedules can change around weather, local ceremonies and course duration. The experience stays guided and student-friendly.",
    ctaEyebrow: "Included in the training rhythm",
    ctaTitle: "Train, explore and integrate in Bali",
    ctaText: "Activities support the course rather than distract from it: culture, nature, recovery and practical embodiment.",
    ctaButton: "View Training Programs",
    categories: {
      All: "All",
      Ceremony: "Ceremony",
      Workshop: "Workshop",
      Nature: "Nature",
      Wellness: "Wellness",
      Creative: "Creative",
    },
    titles: {
      "Holy Temple Purification": "Holy Temple Purification",
      "Balinese Welcome Ceremony": "Balinese Welcome Ceremony",
      "Gabogan Making": "Gabogan Making",
      "Mandala Painting": "Mandala Painting",
      "Sound Healing": "Sound Healing",
      "Acro Yoga Workshop": "Acro Yoga Workshop",
      "Arm Balancing Workshop": "Arm Balancing Workshop",
      "Ice Bath & Breathwork": "Ice Bath & Breathwork",
      "Beach Yoga": "Beach Yoga",
      "Waterfall Excursion": "Waterfall Excursion",
      "Coffee Plantation Visit": "Coffee Plantation Visit",
    },
  },
};

const es = {
  about: {
    story: "Nuestra historia",
    heroTitle: "Una escuela construida sobre",
    heroAccent: "linaje,",
    heroSuffix: "amor y Bali.",
    heroText:
      "Desde 2018, Bali Yoga Teacher Training Center guía a estudiantes de todo el mundo en formaciones auténticas y multiestilo, enraizadas en el linaje clásico y sostenidas por la calma de Ubud.",
    philosophyEyebrow: "Nuestra filosofía",
    philosophyTitle: "El yoga es más que",
    philosophyAccent: "asana",
    philosophyText1:
      "Enseñamos yoga como una forma completa de vida: cuerpo, respiración, mente y espíritu. Las formaciones unen Hatha, Ashtanga, Vinyasa y filosofía yóguica.",
    philosophyText2:
      "Creemos que un verdadero profesor primero se vuelve un verdadero estudiante. Cada grupo es pequeño, con profesores senior y práctica diaria real.",
    milestonesEyebrow: "Hitos",
    milestonesTitle: "Nuestro",
    milestonesAccent: "camino",
    milestonesSuffix: "hasta ahora",
    statsEyebrow: "En números",
    statsTitle: "Una comunidad de",
    statsAccent: "profesores",
    statGraduates: "Graduados",
    statCountries: "Países",
    statRating: "Valoración Google",
    statEstablished: "Fundada",
    milestones: [
      { y: 2018, t: "Fundación de la escuela", d: "Bali YTTC abre sus puertas en Ubud con el primer grupo de 200 horas." },
      { y: 2019, t: "Yoga Alliance RYS", d: "Registro oficial como escuela Yoga Alliance RYS 200." },
      { y: 2021, t: "Se agregan 100h y 300h", d: "El programa se amplía para principiantes y profesores avanzados." },
      { y: 2024, t: "1.500+ graduados", d: "Nuestra comunidad llega a más de 60 países." },
      { y: 2026, t: "2.500+ y creciendo", d: "Nueva ala de ashram, más talleres y el mismo linaje." },
    ],
  },
  contact: {
    eyebrow: "Contacta admisiones",
    title: "Pregunta todo antes de elegir tu formación",
    intro: "¿Necesitas ayuda con curso, fechas, visa, alojamiento, pago o traslado? Envíanos un mensaje claro y te guiaremos paso a paso.",
    trustTitle: "Admisiones sin presión",
    trustText: "Puedes preguntar primero. La plaza se reserva solo cuando confirmamos disponibilidad y pagas el depósito.",
    formTitle: "Enviar mensaje",
    formText: "Incluye curso, mes preferido y dudas de viaje o pago. Normalmente respondemos en un día hábil.",
    fullName: "Nombre completo *",
    email: "Email *",
    phone: "WhatsApp / teléfono",
    topic: "Tema",
    message: "Mensaje *",
    namePlaceholder: "Tu nombre",
    messagePlaceholder: "Ejemplo: Me interesa el curso de 200 horas en julio. ¿Está incluido el alojamiento compartido?",
    sending: "Enviando...",
    send: "Enviar mensaje",
    whatsapp: "Escríbenos por WhatsApp",
    successTitle: "Mensaje enviado",
    successDesc: "Admisiones responderá pronto por email o WhatsApp.",
    errorTitle: "Mensaje no enviado",
    errorDesc: "Prueba WhatsApp si el formulario no funciona.",
    fastestReply: "Respuesta más rápida",
    whatsappAdmissions: "Admisiones por WhatsApp",
    emailLabel: "Email",
    phoneLabel: "Teléfono",
    emailText: "Preguntas sobre cursos, pagos y documentos",
    phoneText: "Llama en horario de Bali",
    nextTitle: "¿Qué pasa después de contactarnos?",
    steps: [
      "Cuéntanos tu curso y fechas preferidas.",
      "Admisiones confirma disponibilidad y responde tus dudas.",
      "Reserva tu plaza solo cuando estés listo para pagar el depósito.",
    ],
    visitEyebrow: "Visita la escuela",
    visitTitle: "Encuéntranos en Ubud, Bali",
    visitText: "Bali YTTC está en Ubud, rodeada de naturaleza, espacios de práctica y alojamiento para estudiantes.",
    hours: "Horario de admisiones",
    bestTime: "Mejor momento para preguntar",
    mapText: "Abre el mapa para ver rutas, tráfico y referencias cercanas.",
    directions: "Cómo llegar",
    courseOptions: ["Pregunta general", "50 horas Hatha Vinyasa YTT", "100 horas Multiestilo YTT", "200 horas Hatha Ashtanga Vinyasa YTT", "300 horas avanzado YTT", "Retiros / talleres", "Pago / visa / alojamiento"],
  },
  schedule: {
    eyebrow: "Calendario de formación 2026",
    title: "Próximas fechas de formación de yoga en Ubud",
    intro: "Compara cada grupo por curso, precio y disponibilidad. Elige una fecha, aplica online y admisiones confirmará tu plaza antes del depósito.",
    viewDetails: "Ver detalles del curso",
    to: "a",
    apply: "Aplicar para esta fecha",
    fewSeats: "Pocas plazas",
    available: "Disponible",
  },
  activities: {
    backHome: "Volver al inicio",
    eyebrow: "Experiencias de yoga",
    title: "Actividades y",
    accent: "talleres",
    subtitle: "Ceremonias culturales, naturaleza y talleres prácticos para integrar el yoga más allá del aula.",
    search: "Buscar ceremonias, talleres, naturaleza...",
    all: "Todo",
    readDetails: "Leer detalles",
    learnMore: "Saber más",
    notesTitle: "Notas detalladas de actividades",
    included: "Incluido",
    bestFor: "Ideal para",
    faqEyebrow: "FAQ de actividades",
    faqTitle: "Antes de unirte",
    ctaEyebrow: "Incluido en el ritmo de formación",
    ctaTitle: "Practica, explora e integra en Bali",
    ctaButton: "Ver programas",
    categories: { All: "Todo", Ceremony: "Ceremonia", Workshop: "Taller", Nature: "Naturaleza", Wellness: "Bienestar", Creative: "Creativo" },
    titles: {
      "Holy Temple Purification": "Purificación en templo sagrado",
      "Balinese Welcome Ceremony": "Ceremonia balinesa de bienvenida",
      "Gabogan Making": "Elaboración de Gabogan",
      "Mandala Painting": "Pintura de mandalas",
      "Sound Healing": "Sanación sonora",
      "Acro Yoga Workshop": "Taller de Acro Yoga",
      "Arm Balancing Workshop": "Taller de equilibrio sobre brazos",
      "Ice Bath & Breathwork": "Baño de hielo y respiración",
      "Beach Yoga": "Yoga en la playa",
      "Waterfall Excursion": "Excursión a cascada",
      "Coffee Plantation Visit": "Visita a plantación de café",
    },
  },
};

const generic: CopyTree = {
  about: {
    story: "School story",
    heroTitle: "A yoga school rooted in",
    heroAccent: "tradition,",
    heroSuffix: "practice and Bali.",
    heroText: "Bali YTTC offers Yoga Alliance certified teacher trainings in Ubud with small groups, senior teachers and a calm residential learning environment.",
    philosophyEyebrow: "Philosophy",
    philosophyTitle: "Yoga is more than",
    philosophyAccent: "asana",
    philosophyText1: "Our training combines physical practice, breath, meditation, anatomy, philosophy and teaching methodology.",
    philosophyText2: "Students receive practical guidance, personal feedback and time to integrate the teachings.",
    milestonesEyebrow: "Milestones",
    milestonesTitle: "Our",
    milestonesAccent: "journey",
    milestonesSuffix: "so far",
    statsEyebrow: "Numbers",
    statsTitle: "A community of",
    statsAccent: "teachers",
    statGraduates: "Graduates",
    statCountries: "Countries",
    statRating: "Rating",
    statEstablished: "Established",
  },
  contact: {
    eyebrow: "Contact admissions",
    title: "Ask us before you choose your training",
    intro: "Our admissions team can help with courses, dates, visa, accommodation, payment and travel questions.",
    trustTitle: "No pressure admissions",
    trustText: "Ask questions first. Reserve only after availability is confirmed.",
    formTitle: "Send a message",
    formText: "Share your preferred course, month and questions.",
    fullName: "Full name *",
    email: "Email *",
    phone: "WhatsApp / phone",
    topic: "Topic",
    message: "Message *",
    send: "Send message",
    sending: "Sending...",
    whatsapp: "WhatsApp us",
    nextTitle: "What happens next?",
    visitTitle: "Find us in Ubud, Bali",
    directions: "Get directions",
  },
};

const overrides: Partial<Record<Locale, CopyTree>> = {
  es,
  de: generic,
  fr: generic,
  id: generic,
  ja: generic,
  ko: generic,
  zh: generic,
  ru: generic,
};

export function getPageCopy<T extends keyof typeof en>(locale: string | null | undefined, section: T): (typeof en)[T] {
  const normalized = normalizePageLocale(locale);
  const merged = mergeCopy(en, overrides[normalized] || {});
  return merged[section] as (typeof en)[T];
}
