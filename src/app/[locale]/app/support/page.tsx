"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, HelpCircle, Loader2, Mail, MessageSquare, Phone, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePublicSiteSettings } from "@/lib/use-public-site-settings";

const helpTopics = [
  {
    title: "Portal Access",
    body: "Use the exact email used during payment. Deposit unlocks pre-arrival resources; full payment unlocks schedule, lessons, progress, and certificates.",
  },
  {
    title: "Payment Status",
    body: "Bank transfer, online payment, and deposit records update after the school team verifies the payment against your enrollment.",
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

type SupportTicket = {
  id: string;
  subject: string;
  course?: string | null;
  status: "NEW" | "CONTACTED" | "INTERESTED" | "ENROLLED" | "NOT_INTERESTED" | "SPAM";
  notes?: string | null;
  followUpAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

const ticketStatusClass: Record<SupportTicket["status"], string> = {
  NEW: "bg-blue-50 text-blue-700",
  CONTACTED: "bg-orange-50 text-orange-700",
  INTERESTED: "bg-purple-50 text-purple-700",
  ENROLLED: "bg-green-50 text-green-700",
  NOT_INTERESTED: "bg-gray-100 text-gray-700",
  SPAM: "bg-red-50 text-red-700",
};

export default function StudentSupportPage() {
  const [subject, setSubject] = useState("Student portal support");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const siteSettings = usePublicSiteSettings();
  const supportMessage = message || `Hi ${siteSettings.general.schoolName}, I need help with my student portal.`;
  const mailto = `mailto:${siteSettings.general.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(supportMessage)}`;
  const whatsappUrl = `https://wa.me/${siteSettings.whatsappNumber}?text=${encodeURIComponent(supportMessage)}`;

  const loadTickets = async () => {
    setTicketsLoading(true);
    try {
      const response = await fetch("/api/app/support", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Could not load support requests");
      }
      setTickets(result.tickets || []);
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Could not load support requests." });
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, []);

  const submitTicket = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/app/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Could not submit support request");
      }
      setMessage("");
      setStatus({ type: "success", message: `Support request created. Ticket ID: ${result.ticketId}` });
      await loadTickets();
    } catch (error) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Could not submit support request." });
    } finally {
      setSaving(false);
    }
  };

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
            {status && (
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${
                  status.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {status.type === "success" ? <CheckCircle2 className="mr-2 inline h-4 w-4" /> : null}
                {status.message}
              </div>
            )}
            <div className="space-y-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-orange-500" />
                {siteSettings.general.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-orange-500" />
                {siteSettings.general.phone}
              </p>
            </div>
            <label className="space-y-2 text-sm text-gray-700">
              <span className="font-medium">Subject</span>
              <input
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-300"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={160}
              />
            </label>
            <textarea
              className="min-h-36 w-full rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-orange-300"
              placeholder="Write your question here."
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={3000}
            />
            <Button
              className="w-full bg-orange-500 text-white hover:bg-orange-600"
              disabled={saving || subject.trim().length < 3 || message.trim().length < 10}
              onClick={submitTicket}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit support request
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href={mailto}>
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

      <Card className="mt-6 border-0 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-orange-500" />
            Recent Support Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ticketsLoading ? (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading support requests...
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
              No support requests yet. When you submit a request, its status will appear here.
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-lg border border-gray-100 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{ticket.subject}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {ticket.course || "Student portal"} - {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <Badge className={`w-fit ${ticketStatusClass[ticket.status] || "bg-gray-100 text-gray-700"}`}>
                    {ticket.status.replaceAll("_", " ").toLowerCase()}
                  </Badge>
                </div>
                {ticket.followUpAt ? (
                  <p className="mt-3 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-700">
                    Follow-up planned for {new Date(ticket.followUpAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                ) : null}
                {ticket.notes ? <p className="mt-3 text-sm leading-6 text-gray-600">{ticket.notes}</p> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
