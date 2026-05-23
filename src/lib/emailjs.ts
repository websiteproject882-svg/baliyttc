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
    // Save to database
    try {
      await fetch("/api/leads", {
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
    } catch (dbError) {
      console.error("Failed to save lead to database:", dbError);
    }

    // If EmailJS is not configured, simulate success for development
    if (!EMAILJS_PUBLIC_KEY) {
      console.log("EmailJS not configured. Simulating email send:", data);
      return { success: true };
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
      console.log("EmailJS not configured. Simulating application email:", data);
      return { success: true };
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
