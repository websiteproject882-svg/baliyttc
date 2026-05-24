"use client";

import emailjs from "@emailjs/browser";

const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "service_baliyttc";
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "template_contact";
const EMAILJS_ADMIN_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_ADMIN_TEMPLATE_ID || "template_admin_notification";
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@baliyttc.com";

interface ContactFormData {
  phone?: string;
  name: string;
  email: string;
  course?: string;
  message: string;
}

export async function sendContactEmail(data: ContactFormData): Promise<{ success: boolean; error?: string }> {
  try {
    let leadSaved = false;
    let leadError = "Could not save your message. Please try WhatsApp instead.";

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || "",
          source: "contact_form",
          course: data.course || "",
          message: data.message,
          status: "NEW",
        }),
      });
      if (response.ok) {
        leadSaved = true;
      } else {
        const body = await response.json().catch(() => null);
        leadError = body?.error || leadError;
      }
    } catch (dbError) {
      console.error("Failed to save lead to database:", dbError);
    }

    // In production the public lead API is the source of truth; it also triggers
    // server-side notification email when Resend is configured.
    if (!EMAILJS_PUBLIC_KEY) {
      return leadSaved ? { success: true } : { success: false, error: leadError };
    }

    const templateParams = {
      from_name: data.name,
      from_email: data.email,
      course: data.course || "General inquiry",
      message: data.message,
      reply_to: data.email,
    };

    // Send to admin
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_ADMIN_TEMPLATE_ID,
      {
        ...templateParams,
        to_name: "Bali YTTC Team",
        admin_email: CONTACT_EMAIL,
      },
      EMAILJS_PUBLIC_KEY
    );

    return { success: true };
  } catch (error) {
    console.error("EmailJS Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email"
    };
  }
}

export async function sendApplicationEmail(data: {
  name: string;
  email: string;
  phone: string;
  course: string;
  date?: string;
  message?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!EMAILJS_PUBLIC_KEY) {
      return {
        success: false,
        error: "Application email is not configured. Please use the website application form or WhatsApp.",
      };
    }

    const templateParams = {
      from_name: data.name,
      from_email: data.email,
      phone: data.phone,
      course: data.course,
      preferred_date: data.date || "TBD",
      message: data.message || "No message",
      reply_to: data.email,
    };

    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_ADMIN_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    return { success: true };
  } catch (error) {
    console.error("EmailJS Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email"
    };
  }
}

// WhatsApp message helper
export function getWhatsAppLink(phone: string, message?: string): string {
  const baseUrl = "https://wa.me";
  const cleanPhone = phone.replace(/\D/g, "");
  const encodedMessage = message ? encodeURIComponent(message) : "";
  return `${baseUrl}/${cleanPhone}${encodedMessage ? `?text=${encodedMessage}` : ""}`;
}

// Generate WhatsApp pre-filled message for contact
export function getContactWhatsAppMessage(data: ContactFormData): string {
  return `Hi Bali YTTC!

I'm ${data.name}
Email: ${data.email}
${data.course ? `Interested in: ${data.course}` : ""}

${data.message}`;
}

// Generate WhatsApp pre-filled message for enrollment
export function getEnrollmentWhatsAppMessage(data: {
  name: string;
  email: string;
  phone: string;
  course: string;
}): string {
  return `Hi Bali YTTC!

I'd like to enroll for ${data.course}

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone}

Please help me with the enrollment process.`;
}
