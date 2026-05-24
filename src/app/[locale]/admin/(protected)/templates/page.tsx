"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Mail, Edit, Save, Eye, CheckCircle, Clock, FileText,
  Send, Copy, RotateCcw
} from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: "enrollment" | "prearrival" | "reminder" | "certificate" | "review" | "earlybird" | "visa";
  lastUpdated: string;
  variables: string[];
}

const templateConfig: Record<string, { label: string; icon: string; description: string; defaultSubject: string }> = {
  enrollment: { label: "Enrollment Confirmation", icon: "📧", description: "Sent when student completes enrollment", defaultSubject: "Welcome to Bali YTTC - Enrollment Confirmed!" },
  prearrival: { label: "Pre-Arrival", icon: "✈️", description: "Sent 7 days before batch starts", defaultSubject: "Your Bali YTTC Journey Begins Soon!" },
  reminder: { label: "Payment Reminder", icon: "⏰", description: "Sent for pending payments", defaultSubject: "Complete Your Enrollment - Payment Reminder" },
  certificate: { label: "Certificate", icon: "🏆", description: "Sent when certificate is issued", defaultSubject: "Congratulations! Your YTTC Certificate is Ready" },
  review: { label: "Review Request", icon: "⭐", description: "Sent after training completes", defaultSubject: "Share Your Bali YTTC Experience" },
  earlybird: { label: "Early Bird", icon: "🦜", description: "Early bird discount announcement", defaultSubject: "Early Bird Special - Save on Your YTTC!" },
  visa: { label: "Visa Information", icon: "🛂", description: "Visa assistance info", defaultSubject: "Bali Visa Information - Important Read" },
};

const defaultTemplates: EmailTemplate[] = [
  {
    id: "enrollment",
    name: "Enrollment Confirmation",
    subject: "Welcome to Bali YTTC - Enrollment Confirmed!",
    content: `Dear {{student_name}},

Congratulations on enrolling in our {{course_name}} at Bali YTTC!

Here's your enrollment summary:
- Course: {{course_name}}
- Batch: {{batch_name}}
- Start Date: {{start_date}}
- Amount Paid: {{amount_paid}}

What happens next:
1. You'll receive your pre-arrival materials 7 days before the course
2. Join our WhatsApp group for updates
3. Download our travel guide

If you have any questions, reply to this email or WhatsApp us.

See you in Bali!
Namaste,
Bali YTTC Team`,
    type: "enrollment",
    lastUpdated: new Date().toISOString(),
    variables: ["student_name", "course_name", "batch_name", "start_date", "amount_paid"],
  },
  {
    id: "prearrival",
    name: "Pre-Arrival",
    subject: "Your Bali YTTC Journey Begins Soon!",
    content: `Dear {{student_name}},

Your {{course_name}} at Bali YTTC starts in just 7 days! Here's everything you need to know:

📍 Location: Ubud, Bali
📅 Start Date: {{start_date}}
🕐 Arrival Time: 2 PM on {{start_date}}

Pre-Arrival Checklist:
✓ Watch the preparation videos in your student portal
✓ Download the course manual
✓ Read the Bali travel guide
✓ Pack according to our checklist

What's included:
- Shared villa accommodation
- 3 sattvic meals daily
- All workshops and ceremonies
- Airport transfer (if booked)

Please reply with your arrival flight details.

See you soon!
Bali YTTC Team`,
    type: "prearrival",
    lastUpdated: new Date().toISOString(),
    variables: ["student_name", "course_name", "batch_name", "start_date"],
  },
  {
    id: "reminder",
    name: "Payment Reminder",
    subject: "Complete Your Enrollment - Payment Reminder",
    content: `Dear {{student_name}},

We noticed your enrollment for {{course_name}} is incomplete.

Amount Due: {{amount_due}}
Due Date: {{due_date}}

To secure your spot in the {{batch_name}} batch, please complete your payment soon. Seats are limited!

Payment Methods:
1. Bank Transfer (details in your enrollment email)
2. Razorpay (use the payment link)
3. PayPal

If you've already made the payment, please ignore this reminder and reply with your transaction details.

Questions? We're here to help!

Namaste,
Bali YTTC Team`,
    type: "reminder",
    lastUpdated: new Date().toISOString(),
    variables: ["student_name", "course_name", "batch_name", "amount_due", "due_date"],
  },
  {
    id: "certificate",
    name: "Certificate",
    subject: "Congratulations! Your YTTC Certificate is Ready",
    content: `Dear {{student_name}},

Congratulations! You have successfully completed the {{course_name}} at Bali YTTC!

Your Certificate:
- Certificate ID: {{certificate_id}}
- Issue Date: {{issue_date}}
- Training Hours: {{training_hours}}

You can download your certificate from your student portal or click the link below.

Your certificate is registered with Yoga Alliance, making you eligible to teach yoga worldwide.

Thank you for being part of our Bali family. We'd love to hear about your teaching journey - stay in touch!

With love and gratitude,
Bali YTTC Team`,
    type: "certificate",
    lastUpdated: new Date().toISOString(),
    variables: ["student_name", "course_name", "certificate_id", "issue_date", "training_hours"],
  },
  {
    id: "review",
    name: "Review Request",
    subject: "Share Your Bali YTTC Experience",
    content: `Dear {{student_name}},

Namaste from Bali!

We hope you're settling well after your {{course_name}} training. We'd love to hear about your experience!

Your review helps:
- Future students make informed decisions
- Us improve our programs
- Build our community

Please take a moment to share:
- Google Review: {{google_review_link}}
- Or reply to this email with your testimonial

For a limited time, leaving a review enters you into our referral program - recommend a friend and both get 10% off future courses!

Thank you for being part of the Bali YTTC family.

Om Shanti,
Bali YTTC Team`,
    type: "review",
    lastUpdated: new Date().toISOString(),
    variables: ["student_name", "course_name", "google_review_link"],
  },
  {
    id: "earlybird",
    name: "Early Bird Offer",
    subject: "Early Bird Special - Save on Your YTTC!",
    content: `Namaste!

Good news for aspiring yoga teachers! Our Early Bird offer is now LIVE:

{{course_name}} - Save {{discount_amount}}!
- Original Price: {{original_price}}
- Early Bird Price: {{early_bird_price}}
- Deadline: {{deadline}}

Why choose Bali YTTC?
✓ Yoga Alliance certified
✓ Beautiful Ubud campus
✓ Expert teachers from India and Bali
✓ All-inclusive (accommodation, meals, ceremonies)

Early Bird spots are limited - don't miss out!

Enroll now: {{enrollment_link}}

Om Shanti,
Bali YTTC Team`,
    type: "earlybird",
    lastUpdated: new Date().toISOString(),
    variables: ["course_name", "discount_amount", "original_price", "early_bird_price", "deadline", "enrollment_link"],
  },
  {
    id: "visa",
    name: "Visa Information",
    subject: "Bali Visa Information - Important Read",
    content: `Dear {{student_name}},

Welcome to Bali! Here is important visa information for your training:

VISA ON ARRIVAL (VOA) - Most common option:
- Valid for 30 days
- Can be extended once for 30 more days
- Cost: ~$35 USD
- Bring passport-size photos

Extension Required (for courses longer than 30 days):
- We assist with B211A visa sponsorship
- Additional cost applies
- Processing time: ~2 weeks

What to bring:
✓ Passport (6+ months validity)
✓ Return ticket proof
✓ Accommodation proof
✓ Passport photos
✓ Vaccination certificate (optional)

Contact us if you need a sponsorship letter for visa application.

See you in Bali!

Bali YTTC Team`,
    type: "visa",
    lastUpdated: new Date().toISOString(),
    variables: ["student_name", "course_name"],
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editedSubject, setEditedSubject] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewDialog, setPreviewDialog] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTemplates() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/templates");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load templates");
        }

        const storedTemplates = Array.isArray(data.templates) ? data.templates : [];
        const merged = defaultTemplates.map((template) => {
          const stored = storedTemplates.find((item: Partial<EmailTemplate> & { slug?: string }) =>
            item.type === template.type || item.id === template.id || item.slug === template.type,
          );

          if (!stored) return template;

          return {
            ...template,
            id: String(stored.id || template.id),
            name: String(stored.name || template.name),
            subject: String(stored.subject || template.subject),
            content: stored.content ? String(stored.content) : template.content,
            lastUpdated: String(stored.lastUpdated || template.lastUpdated),
            variables: Array.isArray(stored.variables) && stored.variables.length ? stored.variables : template.variables,
          };
        });

        if (!cancelled) {
          setTemplates(merged);
          setSelectedTemplate((current) => {
            if (!current) return current;
            return merged.find((template) => template.type === current.type) || current;
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load templates");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTemplates();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedContent(template.content);
    setEditedSubject(template.subject);
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTemplate.id,
          type: selectedTemplate.type,
          name: selectedTemplate.name,
          subject: editedSubject,
          content: editedContent,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save template");
      }

      const updatedTemplate: EmailTemplate = {
        ...selectedTemplate,
        subject: data.template?.subject || editedSubject,
        content: data.template?.content || editedContent,
        lastUpdated: data.template?.lastUpdated || new Date().toISOString(),
        variables: data.template?.variables?.length ? data.template.variables : selectedTemplate.variables,
      };

      setTemplates((current) => current.map((template) => (template.type === selectedTemplate.type ? updatedTemplate : template)));
      setSelectedTemplate(updatedTemplate);
      setSaved(true);
      setEditMode(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!selectedTemplate) return;
    const original = defaultTemplates.find(t => t.id === selectedTemplate.id);
    if (original) {
      setEditedContent(original.content);
      setEditedSubject(original.subject);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const renderPreviewLine = (line: string) => {
    if (!line) return <span aria-hidden="true">&nbsp;</span>;

    return line.split(/(\{\{\w+\}\})/g).map((part, index) => {
      const variable = part.match(/^\{\{(\w+)\}\}$/)?.[1];

      if (variable) {
        return (
          <span key={`${variable}-${index}`} className="rounded bg-blue-100 px-1 text-blue-700">
            {variable}
          </span>
        );
      }

      return part;
    });
  };

  const renderPreview = (content: string) => {
    return content.split("\n").map((line, i) => (
      <p key={i} className="mb-2">
        {renderPreviewLine(line)}
      </p>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
            <p className="text-sm text-gray-500 mt-1">Edit email content sent to students</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <Card className="border border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-36 rounded-xl" />
            ))}
          </div>
        )}

        {/* Template List */}
        <div className={`grid md:grid-cols-2 lg:grid-cols-3 gap-4 ${loading ? "opacity-60" : ""}`}>
          {templates.map(template => {
            const config = templateConfig[template.type];
            return (
              <Card
                key={template.id}
                className={`border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                  selectedTemplate?.id === template.id ? "ring-2 ring-orange-500" : ""
                }`}
                onClick={() => { setSelectedTemplate(template); setEditMode(false); }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{config.label}</h3>
                        <p className="text-xs text-gray-500">{config.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-400">Subject:</p>
                      <p className="text-sm text-gray-700 line-clamp-1">{template.subject}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Updated: {formatDate(template.lastUpdated)}</span>
                      <span>{template.variables.length} variables</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Editor */}
        {selectedTemplate && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{templateConfig[selectedTemplate.type].icon}</span>
                  <div>
                    <CardTitle>{templateConfig[selectedTemplate.type].label}</CardTitle>
                    <p className="text-sm text-gray-500">{templateConfig[selectedTemplate.type].description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewDialog(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  {!editMode && (
                    <Button size="sm" onClick={() => handleEdit(selectedTemplate)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Subject Line</label>
                    <Input
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      placeholder="Email subject..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Email Content
                      <span className="text-gray-400 font-normal ml-2">
                        (Variables: {selectedTemplate.variables.map(v => `{{${v}}}`).join(", ")})
                      </span>
                    </label>
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="min-h-[400px] font-mono text-sm"
                      placeholder="Email content..."
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      <p>Use {"{{variable_name}}"} for dynamic content</p>
                      <p>Available: {selectedTemplate.variables.map(v => `{{${v}}}`).join(", ")}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleReset}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => void handleSave()} disabled={saving}>
                        {saving ? (
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4 animate-spin" /> Saving...
                          </span>
                        ) : saved ? (
                          <span className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" /> Saved!
                          </span>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-1">Subject:</p>
                    <p className="text-lg font-medium text-gray-900">{selectedTemplate.subject}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-6 border">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {selectedTemplate.content}
                    </pre>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    <p>Variables used: {selectedTemplate.variables.map(v => `{{${v}}}`).join(", ")}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="py-4">
              <div className="bg-gray-100 rounded-t-lg p-4 border-b">
                <p className="text-xs text-gray-500 mb-1">To: student@example.com</p>
                <p className="font-medium">Subject: {editedSubject || selectedTemplate.subject}</p>
              </div>
              <div className="bg-white rounded-b-lg p-6 border min-h-[300px]">
                <div className="prose prose-sm">
                  {renderPreview(editedContent || selectedTemplate.content)}
                </div>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Variables like {"{{student_name}}"} will be replaced with actual student data when the email is sent.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
