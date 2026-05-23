"use client";
import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePublicSiteSettings } from "@/lib/use-public-site-settings";

interface FAQ {
  keywords: string[];
  question: string;
  answer: string;
  category: string;
}

const cleanFaqDatabase: Record<string, FAQ[]> = {
  en: [
    {
      keywords: ["course", "program", "training", "ytt", "yoga teacher", "beginner"],
      question: "Which course should I choose?",
      answer: "Choose 50hr for a short foundation, 100hr for an 11-day beginner immersion, 200hr for your main teaching certification, and 300hr if you already hold a 200hr certificate.",
      category: "Courses",
    },
    {
      keywords: ["price", "cost", "fee", "investment", "how much"],
      question: "How much does the training cost?",
      answer: "Current starting prices are 50hr EUR 499, 100hr EUR 699, 200hr EUR 1,499, and 300hr EUR 1,899. Your checkout shows the final deposit, balance, and any active offers before payment.",
      category: "Pricing",
    },
    {
      keywords: ["duration", "how long", "days", "weeks", "length"],
      question: "How long is the training?",
      answer: "50hr runs for 6 days, 100hr for 11 days, 200hr for 21 days, and 300hr for 28 days.",
      category: "Courses",
    },
    {
      keywords: ["visa", "entry", "indonesia", "bali", "passport"],
      question: "What visa do I need for Bali?",
      answer: "Most students use Visa on Arrival for shorter stays. For longer 200hr or 300hr plans, confirm the current visa option before booking flights. Our team can guide you after application.",
      category: "Visa",
    },
    {
      keywords: ["accommodation", "room", "stay", "villa", "housing"],
      question: "What accommodation is included?",
      answer: "Course accommodation depends on the selected package and room availability. The booking form and team confirmation show the exact room type before final payment.",
      category: "Accommodation",
    },
    {
      keywords: ["food", "meal", "diet", "vegetarian", "vegan"],
      question: "What food is provided?",
      answer: "Training meals are vegetarian/sattvic by default. Share vegan, gluten-free, allergy, or medical dietary needs during application so the team can confirm support.",
      category: "Food",
    },
    {
      keywords: ["certification", "certificate", "yoga alliance", "ryt", "rys"],
      question: "Will I get certified?",
      answer: "After successful completion of an eligible YTT program, you receive the certificate for that training path. Yoga Alliance registration depends on the program level and completion requirements.",
      category: "Certification",
    },
    {
      keywords: ["payment", "pay", "deposit", "installment", "card", "paypal", "razorpay"],
      question: "How can I pay?",
      answer: "The site supports configured payment options such as Razorpay, PayPal, and manual/bank transfer when enabled by admin. You can pay a deposit or full amount where available.",
      category: "Payment",
    },
    {
      keywords: ["location", "ubud", "where", "airport", "transfer"],
      question: "Where is the school located?",
      answer: "Bali YTTC is based in Ubud, Gianyar Regency, Bali. Contact the team for arrival support and the current airport transfer arrangement.",
      category: "Location",
    },
  ],
  id: [
    {
      keywords: ["kursus", "program", "pelatihan", "ytt", "guru", "pemula"],
      question: "Kursus mana yang harus saya pilih?",
      answer: "Pilih 50hr untuk fondasi singkat, 100hr untuk imersi pemula 11 hari, 200hr untuk sertifikasi mengajar utama, dan 300hr jika Anda sudah punya sertifikat 200hr.",
      category: "Kursus",
    },
    {
      keywords: ["harga", "biaya", "investasi", "berapa"],
      question: "Berapa biaya pelatihan?",
      answer: "Harga mulai saat ini: 50hr EUR 499, 100hr EUR 699, 200hr EUR 1,499, dan 300hr EUR 1,899. Checkout akan menampilkan deposit, sisa pembayaran, dan promo aktif sebelum pembayaran.",
      category: "Harga",
    },
    {
      keywords: ["durasi", "berapa lama", "hari", "minggu"],
      question: "Berapa lama pelatihannya?",
      answer: "50hr berlangsung 6 hari, 100hr 11 hari, 200hr 21 hari, dan 300hr 28 hari.",
      category: "Kursus",
    },
  ],
};

const cleanDefaultResponses: Record<string, { greeting: string; fallback: string; contact: string; suggestions: string[] }> = {
  en: {
    greeting: "Hello! I can help with courses, pricing, visa, accommodation, certification, and payment questions.",
    fallback: "I am not sure yet. Try asking about courses, pricing, visa, accommodation, certification, or payments. You can also chat with our team on WhatsApp.",
    contact: "Would you like to chat with our team directly on WhatsApp?",
    suggestions: ["Which course is right for me?", "How much does it cost?", "What visa do I need?", "Is accommodation included?"],
  },
  id: {
    greeting: "Halo! Saya bisa membantu tentang kursus, harga, visa, akomodasi, sertifikasi, dan pembayaran.",
    fallback: "Saya belum yakin. Coba tanya tentang kursus, harga, visa, akomodasi, sertifikasi, atau pembayaran. Anda juga bisa chat dengan tim kami di WhatsApp.",
    contact: "Apakah Anda ingin chat langsung dengan tim kami di WhatsApp?",
    suggestions: ["Kursus mana yang cocok?", "Berapa biayanya?", "Visa apa yang dibutuhkan?", "Apakah akomodasi termasuk?"],
  },
};

function findBestMatch(input: string, lang: string): FAQ | null {
  const normalizedInput = input.toLowerCase().trim();
  const faqs = cleanFaqDatabase[lang] || cleanFaqDatabase.en;

  for (const faq of faqs) {
    for (const keyword of faq.keywords) {
      if (normalizedInput.includes(keyword.toLowerCase())) {
        return faq;
      }
    }
  }

  const questionWords = ["what", "how", "which", "when", "where", "do", "can", "is", "are", "cost", "price", "berapa", "kursus", "visa"];
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
  const siteSettings = usePublicSiteSettings();
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
      const response = cleanDefaultResponses[lang] || cleanDefaultResponses.en;
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
      const response = cleanDefaultResponses[lang] || cleanDefaultResponses.en;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: match ? match.answer : response.fallback,
        category: match?.category,
      };

      setMessages(prev => [...prev, botMessage]);
    }, 800);
  };

  const suggestions = cleanDefaultResponses[lang]?.suggestions || cleanDefaultResponses.en.suggestions;

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
                <option value="es">Spanish</option>
                <option value="de">Deutsch</option>
                <option value="fr">French</option>
                <option value="ko">Korean</option>
                <option value="ja">Japanese</option>
                <option value="id">Bahasa Indonesia</option>
                <option value="zh">Chinese</option>
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
                  href={`https://wa.me/${siteSettings.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#F04E23] hover:underline flex items-center gap-1"
                >
                  Or chat with us on WhatsApp -&gt;
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
