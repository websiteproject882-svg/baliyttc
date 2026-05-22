"use client";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SITE } from "@/data/site";

interface FAQ {
  keywords: string[];
  question: string;
  answer: string;
  category: string;
}

const faqDatabase: Record<string, FAQ[]> = {
  en: [
    { keywords: ["course", "program", "training", "ytt", "yoga teacher"], question: "Which course should I choose?", answer: "Choose based on your experience: 100hr for beginners (11 days), 200hr for those starting their teaching journey (21 days), 300hr for certified 200hr teachers wanting to advance (28 days).", category: "Courses" },
    { keywords: ["price", "cost", "fee", "investment", "how much"], question: "How much does the training cost?", answer: "100hr from €999, 200hr from €1,499, 300hr from €1,899. All prices include accommodation, meals, training, and Yoga Alliance certification. Deposit starts from €200.", category: "Pricing" },
    { keywords: ["duration", "how long", "days", "weeks", "length"], question: "How long is the training?", answer: "100hr = 11 days, 200hr = 21 days, 300hr = 28 days. All courses run consecutively (no breaks within the program).", category: "Courses" },
    { keywords: ["visa", "entry", "indonesia", "bali", "passport"], question: "What visa do I need for Bali?", answer: "Most students use the Visa on Arrival (VOA) — 30 days for $35 USD. For 200hr/300hr programs, we recommend the B211A social visa (60 days). EU citizens get 30 days free. We provide full visa guidance.", category: "Visa" },
    { keywords: ["accommodation", "room", "stay", "villa", "housing"], question: "What accommodation is included?", answer: "Shared twin room accommodation is included in all course fees. Private room upgrades (+€400) are available subject to availability. All rooms include AC, hot water, Wi-Fi, and private bathroom.", category: "Accommodation" },
    { keywords: ["food", "meal", "diet", "vegetarian", "vegan"], question: "What food is provided?", answer: "All meals are sattvic (vegetarian). Breakfast, lunch, and dinner are included. We accommodate vegan, gluten-free, and other dietary needs — just inform us when booking.", category: "Food" },
    { keywords: ["certification", "certificate", "yoga alliance", "ryt", "rys"], question: "Will I get certified?", answer: "Yes! Upon successful completion, you'll receive a Yoga Alliance RYT certificate (RYS-200, RYS-300, or RYS-500 depending on your program). This is internationally recognized.", category: "Certification" },
    { keywords: ["experience", "beginner", "never", "first time", "no yoga"], question: "Do I need yoga experience?", answer: "100hr is designed for beginners with little to no experience. 200hr is for beginners to intermediate. 300hr requires a 200hr certification. We recommend at least 6 months of regular practice.", category: "Courses" },
    { keywords: ["schedule", "day", "typical", "morning", "evening"], question: "What does a typical day look like?", answer: "Days start at 6am with meditation, followed by 2 hours of asana practice, then philosophy/anatomy lectures, lunch, workshops, and evening practice. Evenings are free. Temple ceremonies and excursions are scheduled weekly.", category: "Schedule" },
    { keywords: ["payment", "pay", "deposit", "installment", "card"], question: "How can I pay?", answer: "We accept Razorpay, PayPal, and bank transfer. Pay a deposit (from €200) to secure your spot, with the balance due 30 days before arrival. Full payment gets 5% discount.", category: "Payment" },
    { keywords: ["cancellation", "refund", "refund policy", "cancel"], question: "What's your cancellation policy?", answer: "Deposits are partially refundable up to 30 days before the course start (minus €50 admin fee). Full payments can be cancelled for a full refund up to 30 days before. Within 30 days, deposits are non-refundable but transferable to future batches.", category: "Policies" },
    { keywords: ["location", "ubud", "where", "airport", "transfer"], question: "Where is the school located?", answer: "We're in Ubud, Gianyar Regency, Bali — the spiritual heart of Bali. Ngurah Rai Airport (DPS) is 90 minutes away. We offer airport transfer arrangements for €25 each way.", category: "Location" },
  ],
  es: [
    { keywords: ["curso", "programa", "formación", "ytt", "profesor"], question: "¿Qué curso debo elegir?", answer: "Elige según tu experiencia: 100hr para principiantes (11 días), 200hr para quienes inician su camino como profesores (21 días), 300hr para profesores certificados (28 días).", category: "Cursos" },
    { keywords: ["precio", "costo", "tarifa", "inversión"], question: "¿Cuánto cuesta la formación?", answer: "100hr desde €999, 200hr desde €1,499, 300hr desde €1,899. Todos los precios incluyen alojamiento, comidas, formación y certificación Yoga Alliance.", category: "Precios" },
    { keywords: ["visa", "visado", "indonesia", "bali", "pasaporte"], question: "¿Qué visa necesito para Bali?", answer: "La mayoría usa el visado a la llegada (VOA) — 30 días por $35 USD. Para programas de 200hr/300hr recomendamos el visado social B211A (60 días).", category: "Visa" },
    { keywords: ["alojamiento", "habitación", "villa", "estancia"], question: "¿Qué alojamiento está incluido?", answer: "Alojamiento en habitación compartida twin está incluido en todas las tarifas. Actualizaciones a villa privada (+€400) y villa de lujo (+€900) disponibles.", category: "Alojamiento" },
  ],
  de: [
    { keywords: ["kurs", "programm", "ausbildung", "ytt", "lehrer"], question: "Welchen Kurs sollte ich wählen?", answer: "Wähle basierend auf deiner Erfahrung: 100Std für Anfänger (11 Tage), 200Std für diejenigen, die ihre Lehrreise beginnen (21 Tage), 300Std für zertifizierte Lehrer (28 Tage).", category: "Kurse" },
    { keywords: ["preis", "kosten", "gebühr", "investition"], question: "Wie viel kostet die Ausbildung?", answer: "100Std ab €999, 200Std ab €1.499, 300Std ab €1.899. Alle Preise beinhalten Unterkunft, Verpflegung, Ausbildung und Yoga Alliance Zertifizierung.", category: "Preise" },
    { keywords: ["visa", "visum", "indonesien", "bali", "reisepass"], question: "Welches Visum brauche ich für Bali?", answer: "Die meisten nutzen das Visum bei Ankunft (VOA) — 30 Tage für $35 USD. Für 200Std/300Std Programme empfehlen wir das B211A Sozialvisum (60 Tage).", category: "Visa" },
    { keywords: ["unterkunft", "zimmer", "villa", "wohnung"], question: "Welche Unterkunft ist inbegriffen?", answer: "Geteilte Zweibettzimmer sind in allen Kursgebühren enthalten. Private Zimmer-Upgrades (+€400) sind je nach Verfügbarkeit möglich.", category: "Unterkunft" },
  ],
  fr: [
    { keywords: ["cours", "programme", "formation", "ytt", "professeur"], question: "Quel cours dois-je choisir?", answer: "Choisissez selon votre expérience : 100h pour débutants (11 jours), 200h pour ceux qui débutent leur parcours d'enseignant (21 jours), 300h pour enseignants certifiés (28 jours).", category: "Cours" },
    { keywords: ["prix", "coût", "tarif", "investissement"], question: "Combien coûte la formation?", answer: "100h à partir de 999€, 200h à partir de 1 499€, 300h à partir de 1 899€. Tous les prix incluent hébergement, repas, formation et certification Yoga Alliance.", category: "Prix" },
    { keywords: ["visa", "indonésie", "bali", "passeport"], question: "Quel visa ai-je besoin pour Bali?", answer: "La plupart utilisent le visa à l'arrivée (VOA) — 30 jours pour 35 USD. Pour les programmes 200h/300h, nous recommandons le visa social B211A (60 jours).", category: "Visa" },
    { keywords: ["hébergement", "chambre", "villa", "logement"], question: "Quel hébergement est inclus?", answer: "Chambre twin partagée incluse dans tous les frais. Mises à niveau villa privée (+400€) et villa de luxe (+900€) disponibles.", category: "Hébergement" },
  ],
  ko: [
    { keywords: ["교육", "프로그램", "요가", "강사"], question: "어떤 과정을 선택해야 하나요?", answer: "100시간은 초보자용(11일), 200시간은 강사之路를 시작하는 분용(21일), 300시간은 자격증 소지자용(28일)입니다.", category: "교육" },
    { keywords: ["가격", "비용", "수업료"], question: "교육 비용은 얼마인가요?", answer: "100시간 €999부터, 200시간 €1,499부터, 300시간 €1,899부터. 모든 가격에 숙박, 식사, 교육, 요가 엘라이언스 자격증 포함.", category: "가격" },
    { keywords: ["비자", "인도네시아", "발리", "여권"], question: "발리에 필요한 비자는 무엇인가요?", answer: "대부분 도착 비자(VOA) 사용 — 30일 $35 USD. 200시간/300시간 프로그램의 경우 B211A 사회비자(60일) 권장.", category: "비자" },
  ],
  ja: [
    { keywords: ["コース", "プログラム", "ヨガ", "先生"], question: "どのコースを選んだらいいですか？", answer: "経験に応じて選択：100時間は初心者向け（11日）、200時間は教える旅を始める方向け（21日）、300時間は認定教師向け（28日）。", category: "コース" },
    { keywords: ["価格", "費用", "料金"], question: "トレーニングの費用はいくらですか？", answer: "100時間€999から、200時間€1,499から、300時間€1,899から。すべての価格に宿泊、食事が含まれます。", category: "価格" },
    { keywords: ["ビザ", "インドネシア", "バリ", "パスポート"], question: "バリに必要なビザは何ですか？", answer: "ほとんどの方が到着ビザ（VOA）を利用 — 30日$35 USD。200時間/300時間プログラムの您にはB211A社会ビザ（60日）をお勧めします。", category: "ビザ" },
  ],
  id: [
    { keywords: ["kursus", "program", "pelatihan", "ytt", "guru"], question: "Kursus mana yang harus saya pilih?", answer: "Pilih berdasarkan pengalaman Anda: 100jam untuk pemula (11 hari), 200jam untuk memulai perjalanan mengajar (21 hari), 300jam untuk guru bersertifikat (28 hari).", category: "Kursus" },
    { keywords: ["harga", "biaya", "investasi"], question: "Berapa biaya pelatihan?", answer: "100jam dari €999, 200jam dari €1.499, 300jam dari €1.899. Semua harga termasuk akomodasi, makanan, pelatihan, dan sertifikasi Yoga Alliance.", category: "Harga" },
    { keywords: ["visa", "visa masuk", "indonesia", "bali", "paspor"], question: "Visa apa yang saya butuhkan untuk Bali?", answer: "Sebagian besar menggunakan Visa on Arrival (VOA) — 30 hari dengan biaya $35 USD. Untuk program 200jam/300jam, kami merekomendasikan visa sosial B211A (60 hari).", category: "Visa" },
  ],
  zh: [
    { keywords: ["课程", "项目", "培训", "瑜伽", "教师"], question: "我应该选择哪个课程？", answer: "根据您的经验选择：100小时适合初学者（11天），200小时适合开始教学之旅的人（21天），300小时适合认证教师（28天）。", category: "课程" },
    { keywords: ["价格", "费用", "投资"], question: "培训费用是多少？", answer: "100小时从€999起，200小时从€1,499起，300小时从€1,899起。所有价格包含住宿、餐饮、培训和瑜伽联盟认证。", category: "价格" },
    { keywords: ["签证", "印度尼西亚", "巴厘岛", "护照"], question: "去巴厘岛需要什么签证？", answer: "大多数学生使用落地签（VOA）— 30天$35 USD。对于200小时/300小时课程，我们推荐B211A社会签证（60天）。", category: "签证" },
  ],
};

const defaultResponses: Record<string, { greeting: string; fallback: string; contact: string; suggestions: string[] }> = {
  en: {
    greeting: "Hello! I'm your Bali YTTC assistant. Ask me about courses, pricing, visas, accommodation, or anything else!",
    fallback: "I'm not sure I understand that. Try asking about courses, pricing, visa requirements, or accommodation. Or click 'Contact Us' to chat with our team directly!",
    contact: "Would you like to chat with our team directly on WhatsApp?",
    suggestions: ["Which course is right for me?", "How much does it cost?", "What visa do I need?", "Is accommodation included?"],
  },
  es: {
    greeting: "¡Hola! Soy tu asistente de Bali YTTC. ¡Pregúntame sobre cursos, precios, visas, alojamiento y más!",
    fallback: "No estoy seguro de entender eso. Prueba preguntando sobre cursos, precios, requisitos de visa o alojamiento.",
    contact: "¿Te gustaría chatear con nuestro equipo en WhatsApp?",
    suggestions: ["¿Qué curso es para mí?", "¿Cuánto cuesta?", "¿Qué visa necesito?", "¿El alojamiento está incluido?"],
  },
  de: {
    greeting: "Hallo! Ich bin dein Bali YTTC Assistent. Frag mich über Kurse, Preise, Visa, Unterkunft und mehr!",
    fallback: "Ich bin nicht sicher, ob ich das verstehe. Versuche es mit Fragen zu Kursen, Preisen, Visa-Anforderungen oder Unterkunft.",
    contact: "Möchtest du direkt mit unserem Team auf WhatsApp chatten?",
    suggestions: ["Welchen Kurs sollte ich wählen?", "Wie viel kostet es?", "Welches Visum brauche ich?", "Welche Unterkunft ist inbegriffen?"],
  },
  fr: {
    greeting: "Bonjour! Je suis votre assistant Bali YTTC. Demandez-moi sur les cours, les prix, les visas, l'hébergement et plus!",
    fallback: "Je ne suis pas sûr de comprendre. Essayez de demander des informations sur les cours, les prix, les exigences de visa ou l'hébergement.",
    contact: "Souhaitez-vous discuter avec notre équipe directement sur WhatsApp?",
    suggestions: ["Quel cours est fait pour moi?", "Combien ça coûte?", "Quel visa ai-je besoin?", "L'hébergement est-il inclus?"],
  },
  ko: {
    greeting: "안녕하세요! 발리 YTTC 어시스턴트입니다. 과정, 가격, 비자, 숙박에 대해 질문하세요!",
    fallback: "잘 이해하지 못했습니다. 과정, 가격, 비자 요건 또는 숙박에 대해 질문해 보세요.",
    contact: "WhatsApp으로 팀과 바로 대화하고 싶으신가요?",
    suggestions: ["어떤 과정이 제게 맞나요?", "비용은 얼마인가요?", "어떤 비자가 필요하나요?", "숙박이 포함되나요?"],
  },
  ja: {
    greeting: "こんにちは！バリのYTTCアシスタントです。コース、料金、ビザ、宿泊についてお聞きください！",
    fallback: "よく理解できませんでした。コース、料金、ビザの要件、宿泊についてお聞きください。",
    contact: "WhatsAppでチームと直接チャットしませんか？",
    suggestions: ["どのコースが適切ですか？", "費用はいくらですか？", "どのビザが必要ですか？", "宿泊は含まれていますか？"],
  },
  id: {
    greeting: "Halo! Saya asisten Bali YTTC Anda. Tanyakan tentang kursus, harga, visa, akomodasi, dan lainnya!",
    fallback: "Saya tidak yakin memahami itu. Coba tanyakan tentang kursus, harga, persyaratan visa, atau akomodasi.",
    contact: "Apakah Anda ingin mengobrol dengan tim kami langsung di WhatsApp?",
    suggestions: ["Kursus mana yang tepat untuk saya?", "Berapa biayanya?", "Visa apa yang saya butuhkan?", "Apakah akomodasi termasuk?"],
  },
  zh: {
    greeting: "你好！我是巴厘岛YTTC助手。问我关于课程、价格、签证、住宿等问题！",
    fallback: "我不确定我理解正确。请尝试询问有关课程、价格、签证要求或住宿的问题。",
    contact: "您想直接在WhatsApp上与我们的团队聊天吗？",
    suggestions: ["哪个课程适合我？", "费用是多少？", "我需要什么签证？", "住宿包括在内吗？"],
  },
};

function findBestMatch(input: string, lang: string): FAQ | null {
  const normalizedInput = input.toLowerCase().trim();
  const faqs = faqDatabase[lang] || faqDatabase.en;

  for (const faq of faqs) {
    for (const keyword of faq.keywords) {
      if (normalizedInput.includes(keyword.toLowerCase())) {
        return faq;
      }
    }
  }

  const questionWords = ["what", "how", "which", "when", "where", "do", "can", "is", "are", "cost", "price", "qué", "cuánto", "cómo", "welche", "wie", "quel", "combien", "어떤", "얼마", "어떻게", "どの", "いくら", "どんな"];
  if (questionWords.some(w => normalizedInput.startsWith(w) || normalizedInput.includes(w))) {
    const inputWords = normalizedInput.split(/\s+/);
    let bestMatch: FAQ | null = null;
    let bestScore = 0;

    for (const faq of faqs) {
      let score = 0;
      for (const word of inputWords) {
        if (faq.question.toLowerCase().includes(word) ||
            faq.answer.toLowerCase().includes(word) ||
            faq.keywords.some(k => k.toLowerCase().includes(word))) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    }

    if (bestScore > 0) return bestMatch;
  }

  return null;
}

interface Message {
  id: string;
  role: "bot" | "user";
  content: string;
  category?: string;
}

export default function SupportBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState("en");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const browserLang = navigator.language.split("-")[0];
    const supportedLangs = ["en", "es", "de", "fr", "ko", "ja", "id", "zh"];
    if (supportedLangs.includes(browserLang)) {
      setLang(browserLang);
    }
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const response = defaultResponses[lang] || defaultResponses.en;
      setMessages([{
        id: "1",
        role: "bot",
        content: response.greeting,
      }]);
    }
  }, [isOpen, lang, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      const match = findBestMatch(input, lang);
      const response = defaultResponses[lang] || defaultResponses.en;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: match ? match.answer : response.fallback,
        category: match?.category,
      };

      setMessages(prev => [...prev, botMessage]);
    }, 800);
  };

  const suggestions = defaultResponses[lang]?.suggestions || defaultResponses.en.suggestions;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-[#F04E23] to-[#D03D12] text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-[0_0_30px_rgba(240,78,35,0.5)] transition-all"
            aria-label="Open support chat"
          >
            <MessageCircle className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-32px)] h-[560px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
          >
            <div className="bg-gradient-to-r from-[#F04E23] to-[#D03D12] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Bali YTTC Assistant</h3>
                  <p className="text-xs text-white/80">Here to help you</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-2">
              <span className="text-xs text-gray-500">Language:</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="text-xs border-none bg-transparent text-gray-700 cursor-pointer focus:outline-none"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="ko">한국어</option>
                <option value="ja">日本語</option>
                <option value="id">Bahasa</option>
                <option value="zh">中文</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === "bot"
                        ? "bg-[#F04E23]/10 text-[#F04E23]"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {msg.role === "bot" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.role === "bot"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-[#F04E23] text-white"
                    }`}>
                      {msg.category && msg.role === "bot" && (
                        <span className="text-xs font-bold text-[#F04E23] bg-[#F04E23]/10 px-2 py-0.5 rounded-full mb-2 inline-block">
                          {msg.category}
                        </span>
                      )}
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 2 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-gray-400 mb-2">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#F04E23] focus:ring-1 focus:ring-[#F04E23]/20"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-10 h-10 bg-[#F04E23] text-white rounded-full flex items-center justify-center hover:bg-[#D03D12] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-center mt-2">
                <a
                  href={`https://wa.me/${SITE.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#F04E23] hover:underline flex items-center gap-1"
                >
                  Or chat with us on WhatsApp →
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
