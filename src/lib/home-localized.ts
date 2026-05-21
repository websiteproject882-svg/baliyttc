export type HomeLocale = "en" | "es" | "de" | "ko" | "zh" | "ja" | "fr" | "ru";

type Card = { title: string; desc: string };
type Teacher = { role: string; bio: string; experience: string };
type Batch = { tuition: string; person: string; cta: string; guarantees: Card[] };
type HomeCopy = {
  common: {
    view: string;
    learnMore: string;
    galleryEyebrow: string;
    galleryTitle: string;
    galleryAccent: string;
    viewGallery: string;
  };
  trust: {
    recognised: string;
    metrics: Array<{ label: string; sub: string }>;
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
    facilitiesTitle: string;
    facilitiesSubtitle: string;
    whyTitle: string;
    facilities: Card[];
    points: string[];
  };
};

const en: HomeCopy = {
  common: {
    view: "View",
    learnMore: "Learn more",
    galleryEyebrow: "Inside Bali YTTC",
    galleryTitle: "Authentic Moments from",
    galleryAccent: "Ubud",
    viewGallery: "View Full Gallery",
  },
  trust: {
    recognised: "Recognised & certified by",
    metrics: [
      { label: "Students trained", sub: "worldwide since 2018" },
      { label: "Average rating", sub: "verified reviews" },
      { label: "Yoga Alliance", sub: "200hr & 300hr certified" },
      { label: "Years experience", sub: "combined faculty" },
    ],
  },
  pillars: [
    { title: "Asana", desc: "Alignment-based practice across Hatha, Ashtanga and Vinyasa." },
    { title: "Pranayama", desc: "Breath techniques to refine energy and awareness." },
    { title: "Anatomy", desc: "Functional anatomy applied to safe, intelligent teaching." },
    { title: "Philosophy", desc: "Yoga Sutras, Bhagavad Gita and the eight limbs." },
    { title: "Methodology", desc: "Cueing, sequencing and the art of holding space." },
    { title: "Adjustments", desc: "Hands-on assists with consent and clarity." },
    { title: "Meditation & Balinese Wisdom", desc: "Guided meditation, inner stillness, Balinese ceremony and cultural wisdom." },
  ],
  experiences: {
    eyebrow: "Beyond the Mat",
    title: "Daily immersions, sacred ceremonies &",
    accent: "cultural integration",
    subtitle: "Every training week features temple rituals, advanced workshops, beach practices, and meditative arts rooted in Balinese culture.",
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
  },
};

const packs: Record<HomeLocale, HomeCopy> = {
  en,
  es: {
    ...en,
    common: { view: "Ver", learnMore: "Saber más", galleryEyebrow: "Dentro de Bali YTTC", galleryTitle: "Momentos auténticos desde", galleryAccent: "Ubud", viewGallery: "Ver galería completa" },
    trust: { recognised: "Reconocido y certificado por", metrics: [{ label: "Estudiantes formados", sub: "desde 2018" }, { label: "Valoración media", sub: "reseñas verificadas" }, { label: "Yoga Alliance", sub: "200h y 300h certificados" }, { label: "Años de experiencia", sub: "facultad combinada" }] },
    pillars: [
      { title: "Asana", desc: "Práctica alineada en Hatha, Ashtanga y Vinyasa." },
      { title: "Pranayama", desc: "Técnicas de respiración para refinar energía y conciencia." },
      { title: "Anatomía", desc: "Anatomía funcional aplicada a una enseñanza segura." },
      { title: "Filosofía", desc: "Yoga Sutras, Bhagavad Gita y los ocho miembros." },
      { title: "Metodología", desc: "Indicaciones, secuencias y presencia docente." },
      { title: "Ajustes", desc: "Asistencias prácticas con consentimiento y claridad." },
    ],
    experiences: { ...en.experiences, eyebrow: "Más allá del mat", title: "Inmersiones diarias, ceremonias sagradas e", accent: "integración cultural", subtitle: "Cada semana incluye rituales, talleres, playa y artes meditativas de la cultura balinesa.", mobileHint: "Toca una experiencia para saber más.", cards: [
      { title: "Purificación en templo", desc: "Ceremonia sagrada balinesa de limpieza." }, { title: "Taller de balances", desc: "Técnica guiada para fuerza y equilibrio." }, { title: "Sanación sonora", desc: "Cuencos y sonido para integración profunda." }, { title: "Acro Yoga", desc: "Práctica en pareja con confianza y juego." }, { title: "Yoga en la playa", desc: "Práctica al amanecer en la costa de Bali." }, { title: "Pintura de mandalas", desc: "Arte meditativo para enfocar la mente." }] },
    teachers: { ...en.teachers, eyebrow: "Conoce a tus guías", title: "Profesores internacionales", accent: "en el camino", subtitle: "Instructores expertos te guían con precisión y compasión.", viewAll: "Ver todos los profesores", cta: "Aprende de instructores certificados por Yoga Alliance", items: en.teachers.items.map((i) => ({ ...i, experience: "15+ años de experiencia docente" })) },
    schedule: { ...en.schedule, eyebrow: "Próximos grupos", title: "Reserva tu plaza para", subtitle: "Grupos pequeños y plazas limitadas.", batchStatuses: ["6 plazas disponibles", "Solo 4 plazas", "Inscripción abierta", "Abierto", "Abierto"], batchCourses: ["YTT 100 horas", "YTT 200 horas", "YTT 300 horas", "YTT 200 horas", "YTT 100 horas"], batch: { tuition: "Matrícula", person: "/ persona", cta: "Reservar plaza", guarantees: [{ title: "Garantía", desc: "Si no estás satisfecho" }, { title: "Fechas flexibles", desc: "Cambia de grupo" }, { title: "Early bird", desc: "Descuentos disponibles" }] } },
    testimonials: { ...en.testimonials, eyebrow: "Historias de estudiantes", title: "Historias de nuestros", accent: "graduados", subtitle: "Transformaciones reales de estudiantes en Ubud.", verified: "reseñas verificadas", topRated: "Mejor valorado en Bali", readVerified: "Lee reseñas verificadas", startJourney: "Comienza tu viaje", viewAll: "Ver reseñas", items: en.testimonials.items.map((i) => ({ course: "Graduado YTT 200 horas", quote: i.quote })) },
    video: { ...en.video, eyebrow: "Campus y comunidad", title: "Vive el santuario", subtitle: "Recorre nuestro santuario de yoga en Ubud.", facilitiesTitle: "Instalaciones de calidad", facilitiesSubtitle: "Todo para practicar sin distracciones", whyTitle: "Por qué eligen Bali YTTC", facilities: en.video.facilities.map((i) => ({ title: i.title, desc: i.desc })), points: en.video.points },
  },
  de: {
    ...en,
    common: { view: "Ansehen", learnMore: "Mehr erfahren", galleryEyebrow: "In Bali YTTC", galleryTitle: "Authentische Momente aus", galleryAccent: "Ubud", viewGallery: "Galerie ansehen" },
    trust: { recognised: "Anerkannt und zertifiziert von", metrics: [{ label: "Ausgebildete Schüler", sub: "weltweit seit 2018" }, { label: "Durchschnittsbewertung", sub: "verifizierte Bewertungen" }, { label: "Yoga Alliance", sub: "200h & 300h zertifiziert" }, { label: "Jahre Erfahrung", sub: "gemeinsames Team" }] },
    pillars: [{ title: "Asana", desc: "Ausrichtungsbasierte Praxis in Hatha, Ashtanga und Vinyasa." }, { title: "Pranayama", desc: "Atemtechniken für Energie und Bewusstsein." }, { title: "Anatomie", desc: "Funktionelle Anatomie für sicheres Unterrichten." }, { title: "Philosophie", desc: "Yoga Sutras, Bhagavad Gita und die acht Glieder." }, { title: "Methodik", desc: "Cueing, Sequencing und Raum halten." }, { title: "Adjustments", desc: "Hilfestellungen mit Zustimmung und Klarheit." }],
    experiences: { ...en.experiences, eyebrow: "Über die Matte hinaus", title: "Tägliche Immersionen, Rituale und", accent: "kulturelle Integration", subtitle: "Jede Trainingswoche verbindet Rituale, Workshops, Strandpraxis und meditative Kunst.", mobileHint: "Tippe eine Erfahrung an.", cards: en.experiences.cards },
    teachers: { ...en.teachers, eyebrow: "Lerne deine Guides kennen", title: "Erfahrene Lehrer", accent: "auf dem Weg", subtitle: "Unsere Lehrer begleiten dich mit Präzision und Mitgefühl.", viewAll: "Alle Lehrer ansehen", cta: "Lerne direkt von Yoga Alliance zertifizierten Lehrern", items: en.teachers.items.map((i) => ({ ...i, experience: "15+ Jahre Unterrichtserfahrung" })) },
    schedule: { ...en.schedule, eyebrow: "Nächste Termine", title: "Sichere deinen Platz für", subtitle: "Kleine Gruppen und begrenzte Plätze.", batchStatuses: ["6 Plätze frei", "Nur 4 Plätze frei", "Anmeldung offen", "Offen", "Offen"], batchCourses: ["100h YTT", "200h YTT", "300h YTT", "200h YTT", "100h YTT"], batch: { tuition: "Kursgebühr", person: "/ Person", cta: "Platz sichern", guarantees: [{ title: "Geld-zurück-Garantie", desc: "Wenn du nicht zufrieden bist" }, { title: "Flexible Daten", desc: "Terminwechsel möglich" }, { title: "Frühbucher-Vorteile", desc: "Rabatte verfügbar" }] } },
    testimonials: { ...en.testimonials, eyebrow: "Erfolgsgeschichten", title: "Geschichten unserer", accent: "Absolventen", subtitle: "Echte Transformationen aus Ubud.", verified: "verifizierte Bewertungen", topRated: "Top bewertet in Bali", readVerified: "Verifizierte Bewertungen lesen", startJourney: "Reise beginnen", viewAll: "Alle Bewertungen", items: en.testimonials.items.map((i) => ({ course: "200h Absolvent", quote: i.quote })) },
    video: { ...en.video, eyebrow: "Campus & Community", title: "Erlebe den Rückzugsort", subtitle: "Sieh dir unseren Yoga-Ort in Ubud an.", facilitiesTitle: "Hochwertige Ausstattung", facilitiesSubtitle: "Alles für fokussierte Praxis", whyTitle: "Warum Schüler Bali YTTC wählen", facilities: en.video.facilities, points: en.video.points },
  },
  fr: {
    ...en,
    common: { view: "Voir", learnMore: "En savoir plus", galleryEyebrow: "Au coeur de Bali YTTC", galleryTitle: "Moments authentiques de", galleryAccent: "Ubud", viewGallery: "Voir la galerie" },
    trust: { recognised: "Reconnu et certifié par", metrics: [{ label: "Étudiants formés", sub: "depuis 2018" }, { label: "Note moyenne", sub: "avis vérifiés" }, { label: "Yoga Alliance", sub: "200h et 300h certifiés" }, { label: "Années d'expérience", sub: "équipe combinée" }] },
    pillars: [{ title: "Asana", desc: "Pratique alignée en Hatha, Ashtanga et Vinyasa." }, { title: "Pranayama", desc: "Techniques de souffle pour l'énergie et la conscience." }, { title: "Anatomie", desc: "Anatomie fonctionnelle pour enseigner en sécurité." }, { title: "Philosophie", desc: "Yoga Sutras, Bhagavad Gita et les huit membres." }, { title: "Méthodologie", desc: "Guidage, séquençage et présence." }, { title: "Ajustements", desc: "Assistances claires et consenties." }],
    experiences: { ...en.experiences, eyebrow: "Au-delà du tapis", title: "Immersions quotidiennes, cérémonies sacrées et", accent: "culture balinaise", subtitle: "Chaque semaine mêle rituels, ateliers, plage et arts méditatifs.", mobileHint: "Touchez une expérience pour en savoir plus.", cards: en.experiences.cards },
    teachers: { ...en.teachers, eyebrow: "Rencontrez vos guides", title: "Professeurs expérimentés", accent: "sur le chemin", subtitle: "Des enseignants vous guident avec précision et compassion.", viewAll: "Voir tous les professeurs", cta: "Apprenez avec des professeurs certifiés Yoga Alliance", items: en.teachers.items.map((i) => ({ ...i, experience: "15+ ans d'expérience d'enseignement" })) },
    schedule: { ...en.schedule, eyebrow: "Prochaines sessions", title: "Réservez votre place pour", subtitle: "Petits groupes et places limitées.", batchStatuses: ["6 places restantes", "Seulement 4 places", "Inscriptions ouvertes", "Ouvert", "Ouvert"], batchCourses: ["YTT 100h", "YTT 200h", "YTT 300h", "YTT 200h", "YTT 100h"], batch: { tuition: "Frais de formation", person: "/ personne", cta: "Réserver ma place", guarantees: [{ title: "Garantie", desc: "Si vous n'êtes pas satisfait" }, { title: "Dates flexibles", desc: "Changez de session" }, { title: "Avantages early bird", desc: "Réductions disponibles" }] } },
    testimonials: { ...en.testimonials, eyebrow: "Histoires d'étudiants", title: "Histoires de nos", accent: "diplômés", subtitle: "Transformations réelles à Ubud.", verified: "avis vérifiés", topRated: "Très bien noté à Bali", readVerified: "Lire les avis vérifiés", startJourney: "Commencer", viewAll: "Voir les avis", items: en.testimonials.items.map((i) => ({ course: "Diplômé 200h", quote: i.quote })) },
    video: { ...en.video, eyebrow: "Campus & communauté", title: "Découvrez le sanctuaire", subtitle: "Visitez notre sanctuaire de yoga à Ubud.", facilitiesTitle: "Installations de qualité", facilitiesSubtitle: "Tout pour pratiquer sans distraction", whyTitle: "Pourquoi choisir Bali YTTC", facilities: en.video.facilities, points: en.video.points },
  },
  ko: {
    ...en,
    common: { view: "보기", learnMore: "더 알아보기", galleryEyebrow: "Bali YTTC 내부", galleryTitle: "우붓의 진짜 순간들", galleryAccent: "우붓", viewGallery: "갤러리 전체 보기" },
    trust: { recognised: "공인 및 인증", metrics: [{ label: "수료생", sub: "2018년부터 전 세계" }, { label: "평균 평점", sub: "검증된 리뷰" }, { label: "Yoga Alliance", sub: "200시간 및 300시간 인증" }, { label: "경력", sub: "강사진 합산" }] },
    pillars: [{ title: "아사나", desc: "하타, 아쉬탕가, 빈야사 기반의 정렬 수련." }, { title: "프라나야마", desc: "에너지와 알아차림을 위한 호흡 기법." }, { title: "해부학", desc: "안전한 지도를 위한 기능 해부학." }, { title: "철학", desc: "요가 수트라, 바가바드 기타, 여덟 가지 길." }, { title: "지도법", desc: "큐잉, 시퀀싱, 수업 공간을 이끄는 법." }, { title: "조정", desc: "동의와 명확성을 바탕으로 한 핸즈온 보조." }],
    experiences: { ...en.experiences, eyebrow: "매트 너머", title: "매일의 몰입, 신성한 의식과", accent: "문화 체험", subtitle: "사원 의식, 워크숍, 해변 수련, 발리 전통 예술을 경험합니다.", mobileHint: "각 경험을 눌러 더 알아보세요.", cards: [{ title: "사원 정화 의식", desc: "첫 주에 진행되는 발리 전통 정화 의식." }, { title: "암 밸런싱 워크숍", desc: "힘과 균형을 위한 테크닉." }, { title: "사운드 힐링", desc: "싱잉볼과 소리 치유." }, { title: "아크로 요가", desc: "신뢰와 놀이가 있는 파트너 요가." }, { title: "해변 요가", desc: "발리 해변의 일출 수련." }, { title: "만다라 페인팅", desc: "마음을 정렬하는 명상 예술." }] },
    teachers: { ...en.teachers, eyebrow: "강사진 소개", title: "세계적 강사진", accent: "함께 걷는 길", subtitle: "경험 많은 강사진이 정확함과 따뜻함으로 안내합니다.", viewAll: "모든 강사 보기", cta: "Yoga Alliance 인증 강사진에게 직접 배우세요", items: en.teachers.items.map((i) => ({ ...i, experience: "15년 이상 지도 경험" })) },
    schedule: { ...en.schedule, eyebrow: "예정 과정", title: "2026년 자리 예약", subtitle: "소규모 그룹과 제한된 좌석.", batchStatuses: ["6자리 남음", "4자리 남음", "등록 가능", "오픈", "오픈"], batchCourses: ["100시간 YTT", "200시간 YTT", "300시간 YTT", "200시간 YTT", "100시간 YTT"], batch: { tuition: "수업료", person: "/ 1인", cta: "자리 예약", guarantees: [{ title: "환불 보장", desc: "만족하지 못할 경우" }, { title: "유연한 일정", desc: "일정 변경 가능" }, { title: "얼리버드 혜택", desc: "할인 가능" }] } },
    testimonials: { ...en.testimonials, eyebrow: "수강생 이야기", title: "졸업생들의", accent: "변화 이야기", subtitle: "우붓에서 경험한 실제 변화.", verified: "검증된 리뷰", topRated: "발리 최고 평점", readVerified: "검증된 리뷰 보기", startJourney: "여정 시작", viewAll: "모든 리뷰 보기", items: en.testimonials.items.map((i) => ({ course: "200시간 수료생", quote: i.quote })) },
    video: { ...en.video, eyebrow: "캠퍼스와 커뮤니티", title: "수련 공간을 경험하세요", subtitle: "우붓의 요가 공간을 둘러보세요.", facilitiesTitle: "전문 시설", facilitiesSubtitle: "집중 수련을 위한 모든 것", whyTitle: "학생들이 Bali YTTC를 선택하는 이유", facilities: en.video.facilities, points: en.video.points },
  },
  zh: {
    ...en,
    common: { view: "查看", learnMore: "了解更多", galleryEyebrow: "Bali YTTC内部", galleryTitle: "来自乌布的真实瞬间", galleryAccent: "乌布", viewGallery: "查看完整图库" },
    trust: { recognised: "认可与认证", metrics: [{ label: "培训学员", sub: "自2018年以来" }, { label: "平均评分", sub: "真实评价" }, { label: "Yoga Alliance", sub: "200小时和300小时认证" }, { label: "教学经验", sub: "导师团队合计" }] },
    pillars: [{ title: "体式", desc: "哈他、阿斯汤加和流瑜伽的正位练习。" }, { title: "呼吸法", desc: "提升能量与觉知的呼吸技巧。" }, { title: "解剖学", desc: "用于安全教学的功能解剖学。" }, { title: "哲学", desc: "瑜伽经、薄伽梵歌和八支瑜伽。" }, { title: "教学法", desc: "口令、编排和课堂空间掌控。" }, { title: "辅助调整", desc: "清晰且经同意的手法辅助。" }],
    experiences: { ...en.experiences, eyebrow: "瑜伽垫之外", title: "每日沉浸、神圣仪式与", accent: "文化融合", subtitle: "每周包含寺庙仪式、工作坊、海滩练习和巴厘冥想艺术。", mobileHint: "点击体验了解更多。", cards: [{ title: "寺庙净化", desc: "第一周的巴厘神圣净化仪式。" }, { title: "手臂平衡工作坊", desc: "力量与平衡的技巧训练。" }, { title: "声音疗愈", desc: "颂钵和声音疗法。" }, { title: "双人瑜伽", desc: "建立信任与乐趣的伙伴练习。" }, { title: "海滩瑜伽", desc: "巴厘海岸的日出练习。" }, { title: "曼陀罗绘画", desc: "让心安定的冥想艺术。" }] },
    teachers: { ...en.teachers, eyebrow: "认识导师", title: "国际导师团队", accent: "同行之路", subtitle: "经验丰富的导师以精准和关怀引导您。", viewAll: "查看全部导师", cta: "向Yoga Alliance认证导师学习", items: en.teachers.items.map((i) => ({ ...i, experience: "15年以上教学经验" })) },
    schedule: { ...en.schedule, eyebrow: "即将开课", title: "预留2026年名额", subtitle: "小班制，名额有限。", batchStatuses: ["剩余6席", "仅剩4席", "开放报名", "开放", "开放"], batchCourses: ["100小时YTT", "200小时YTT", "300小时YTT", "200小时YTT", "100小时YTT"], batch: { tuition: "学费", person: "/ 人", cta: "预留名额", guarantees: [{ title: "退款保证", desc: "如不满意" }, { title: "日期灵活", desc: "可更换批次" }, { title: "早鸟优惠", desc: "可享折扣" }] } },
    testimonials: { ...en.testimonials, eyebrow: "学员故事", title: "来自毕业生的", accent: "成长故事", subtitle: "在乌布完成培训后的真实转变。", verified: "真实评价", topRated: "巴厘高评分", readVerified: "阅读真实评价", startJourney: "开始旅程", viewAll: "查看全部评价", items: en.testimonials.items.map((i) => ({ course: "200小时毕业生", quote: i.quote })) },
    video: { ...en.video, eyebrow: "校园与社区", title: "体验静修空间", subtitle: "参观乌布的瑜伽校园。", facilitiesTitle: "专业设施", facilitiesSubtitle: "专注练习所需的一切", whyTitle: "为什么选择Bali YTTC", facilities: en.video.facilities, points: en.video.points },
  },
  ja: {
    ...en,
    common: { view: "見る", learnMore: "詳しく見る", galleryEyebrow: "Bali YTTCの内側", galleryTitle: "ウブドの本物の瞬間", galleryAccent: "ウブド", viewGallery: "ギャラリーを見る" },
    trust: { recognised: "認定・登録", metrics: [{ label: "受講生", sub: "2018年から世界中で" }, { label: "平均評価", sub: "認証済みレビュー" }, { label: "Yoga Alliance", sub: "200時間・300時間認定" }, { label: "指導経験", sub: "講師陣合計" }] },
    pillars: [{ title: "アーサナ", desc: "ハタ、アシュタンガ、ヴィンヤサのアライメント練習。" }, { title: "プラーナーヤーマ", desc: "エネルギーと意識を整える呼吸法。" }, { title: "解剖学", desc: "安全な指導に役立つ機能解剖学。" }, { title: "哲学", desc: "ヨガスートラ、バガヴァッドギーター、八支則。" }, { title: "指導法", desc: "キューイング、シークエンス、場づくり。" }, { title: "アジャストメント", desc: "同意と明確さを大切にした補助。" }],
    experiences: { ...en.experiences, eyebrow: "マットの先へ", title: "毎日の没入、神聖な儀式と", accent: "文化体験", subtitle: "寺院儀式、ワークショップ、ビーチ練習、瞑想的な芸術を体験します。", mobileHint: "各体験をタップして詳しく見る。", cards: [{ title: "寺院浄化", desc: "最初の週に行うバリの浄化儀式。" }, { title: "アームバランス", desc: "強さとバランスの技術練習。" }, { title: "サウンドヒーリング", desc: "シンギングボウルによる深い統合。" }, { title: "アクロヨガ", desc: "信頼と遊びのパートナー練習。" }, { title: "ビーチヨガ", desc: "バリの海辺での日の出練習。" }, { title: "曼荼羅ペイント", desc: "心を整える瞑想的アート。" }] },
    teachers: { ...en.teachers, eyebrow: "講師紹介", title: "世界基準の講師", accent: "道を歩む人たち", subtitle: "経験豊富な講師が正確さと思いやりで導きます。", viewAll: "全講師を見る", cta: "Yoga Alliance認定講師から直接学べます", items: en.teachers.items.map((i) => ({ ...i, experience: "15年以上の指導経験" })) },
    schedule: { ...en.schedule, eyebrow: "次回コース", title: "2026年の席を確保", subtitle: "少人数制、席数限定。", batchStatuses: ["残り6席", "残り4席", "受付中", "受付中", "受付中"], batchCourses: ["100時間YTT", "200時間YTT", "300時間YTT", "200時間YTT", "100時間YTT"], batch: { tuition: "受講料", person: "/ 1名", cta: "席を確保", guarantees: [{ title: "返金保証", desc: "満足できない場合" }, { title: "日程変更可", desc: "コース変更可能" }, { title: "早割特典", desc: "割引あり" }] } },
    testimonials: { ...en.testimonials, eyebrow: "受講生の物語", title: "卒業生の", accent: "変化の声", subtitle: "ウブドでの本物の変化。", verified: "認証済みレビュー", topRated: "バリで高評価", readVerified: "レビューを読む", startJourney: "旅を始める", viewAll: "全レビュー", items: en.testimonials.items.map((i) => ({ course: "200時間卒業生", quote: i.quote })) },
    video: { ...en.video, eyebrow: "キャンパスとコミュニティ", title: "聖域を体験する", subtitle: "ウブドのヨガ空間を見学しましょう。", facilitiesTitle: "充実した施設", facilitiesSubtitle: "集中した練習に必要なすべて", whyTitle: "Bali YTTCが選ばれる理由", facilities: en.video.facilities, points: en.video.points },
  },
  ru: {
    ...en,
    common: { view: "Смотреть", learnMore: "Подробнее", galleryEyebrow: "Внутри Bali YTTC", galleryTitle: "Настоящие моменты из", galleryAccent: "Убуда", viewGallery: "Смотреть галерею" },
    trust: { recognised: "Признано и сертифицировано", metrics: [{ label: "Обученные студенты", sub: "с 2018 года" }, { label: "Средний рейтинг", sub: "проверенные отзывы" }, { label: "Yoga Alliance", sub: "200ч и 300ч сертификация" }, { label: "Лет опыта", sub: "общий опыт команды" }] },
    pillars: [{ title: "Асана", desc: "Практика выравнивания в Хатха, Аштанга и Виньяса." }, { title: "Пранаяма", desc: "Дыхательные техники для энергии и осознанности." }, { title: "Анатомия", desc: "Функциональная анатомия для безопасного преподавания." }, { title: "Философия", desc: "Йога-сутры, Бхагавад-гита и восемь ступеней." }, { title: "Методика", desc: "Подсказки, последовательности и удержание пространства." }, { title: "Коррекции", desc: "Практические ассисты с согласием и ясностью." }],
    experiences: { ...en.experiences, eyebrow: "За пределами коврика", title: "Ежедневные практики, церемонии и", accent: "культурная интеграция", subtitle: "Каждая неделя включает ритуалы, воркшопы, пляжную практику и медитативное искусство.", mobileHint: "Нажмите на опыт, чтобы узнать больше.", cards: [{ title: "Очищение в храме", desc: "Священная балийская церемония очищения." }, { title: "Баланс на руках", desc: "Техника силы и равновесия." }, { title: "Звуковое исцеление", desc: "Чаши и звук для глубокой интеграции." }, { title: "Акро-йога", desc: "Парная практика доверия и игры." }, { title: "Йога на пляже", desc: "Практика на рассвете у океана." }, { title: "Рисование мандалы", desc: "Медитативное искусство для ума." }] },
    teachers: { ...en.teachers, eyebrow: "Ваши наставники", title: "Опытные преподаватели", accent: "на пути йоги", subtitle: "Наставники ведут вас с точностью и заботой.", viewAll: "Все преподаватели", cta: "Учитесь у преподавателей Yoga Alliance", items: en.teachers.items.map((i) => ({ ...i, experience: "15+ лет опыта преподавания" })) },
    schedule: { ...en.schedule, eyebrow: "Ближайшие курсы", title: "Забронируйте место на", subtitle: "Малые группы и ограниченные места.", batchStatuses: ["6 мест осталось", "Только 4 места", "Набор открыт", "Открыто", "Открыто"], batchCourses: ["100ч YTT", "200ч YTT", "300ч YTT", "200ч YTT", "100ч YTT"], batch: { tuition: "Стоимость курса", person: "/ человек", cta: "Забронировать место", guarantees: [{ title: "Гарантия возврата", desc: "Если вы не удовлетворены" }, { title: "Гибкие даты", desc: "Можно сменить группу" }, { title: "Ранние скидки", desc: "Доступны скидки" }] } },
    testimonials: { ...en.testimonials, eyebrow: "Истории студентов", title: "Истории наших", accent: "выпускников", subtitle: "Настоящие трансформации в Убуде.", verified: "проверенные отзывы", topRated: "Высокий рейтинг на Бали", readVerified: "Читать отзывы", startJourney: "Начать путь", viewAll: "Все отзывы", items: en.testimonials.items.map((i) => ({ course: "Выпускник 200ч", quote: i.quote })) },
    video: { ...en.video, eyebrow: "Кампус и сообщество", title: "Почувствуйте пространство", subtitle: "Прогуляйтесь по нашему йога-центру в Убуде.", facilitiesTitle: "Удобства высокого уровня", facilitiesSubtitle: "Все для спокойной практики", whyTitle: "Почему выбирают Bali YTTC", facilities: en.video.facilities, points: en.video.points },
  },
};

export function getHomeCopy(locale: string): HomeCopy {
  return packs[(locale as HomeLocale) || "en"] || packs.en;
}
