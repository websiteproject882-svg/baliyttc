"use client";

import { useState } from "react";
import { HelpCircle, Mail, MessageSquare, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE } from "@/data/site";

const helpTopics = [
  {
    title: "Portal Access",
    body: "Use the exact email used during payment. Deposit unlocks pre-arrival resources; full payment unlocks schedule, lessons, progress, and certificates.",
  },
  {
    title: "Payment Status",
    body: "Bank transfer payments are verified by admin. Razorpay and PayPal keys can be enabled later when the client account is ready.",
  },
  {
    title: "Certificate",
    body: "Certificate PDF appears after training completion and manual admin approval in Yoga Alliance format.",
  },
  {
    title: "Alumni Access",
    body: "After the course, alumni can keep certificate downloads and school update feed access permanently.",
  },
];

export default function StudentSupportPage() {
  const [message, setMessage] = useState("");
  const mailto = `mailto:${SITE.email}?subject=Student%20Portal%20Support&body=${encodeURIComponent(message)}`;
  const whatsappUrl = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message || "Hi Bali YTTC, I need help with my student portal.")}`;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support</h1>
        <p className="text-sm text-gray-500">Get help with access, payment verification, schedule, certificates, and travel preparation.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-0 bg-white shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-orange-500" />
              Quick Help
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {helpTopics.map((topic) => (
              <div key={topic.title} className="rounded-lg border border-gray-100 p-4">
                <p className="font-semibold text-gray-900">{topic.title}</p>
                <p className="mt-2 text-sm leading-6 text-gray-500">{topic.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              Contact School
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-orange-500" />
                {SITE.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-orange-500" />
                {SITE.phone}
              </p>
            </div>
            <textarea
              className="min-h-36 w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-orange-300"
              placeholder="Write your question here."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <Button asChild className="w-full bg-orange-500 text-white hover:bg-orange-600">
              <a href={mailto}>
                <Send className="mr-2 h-4 w-4" />
                Email support
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                <Phone className="mr-2 h-4 w-4" />
                WhatsApp support
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
