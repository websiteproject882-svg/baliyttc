"use client";

import { useEffect, useState } from "react";
import { Award, Download, Loader2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<Array<{ id: string; certificateId: string; course: string; status: string; issuedAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestingReview, setRequestingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reasons: string[];
    completedHours: number;
    totalHours: number;
    modulesCompleted: number;
    modulesRequired: number;
    completionPercent: number;
    accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI";
  } | null>(null);

  useEffect(() => {
    void fetch("/api/app/portal", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to load certificates");
        }
        return result;
      })
      .then((result) => {
        setCertificates(result.certificates || []);
        setEligibility(result.certificateEligibility || null);
      })
      .catch((error) => setError(error instanceof Error ? error.message : "Failed to load certificates"))
      .finally(() => setLoading(false));
  }, []);

  const requestCertificateReview = async () => {
    setRequestingReview(true);
    setReviewMessage(null);
    try {
      const response = await fetch("/api/app/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "Certificate review request",
          message:
            "I have completed the certificate requirements shown in my student portal. Please review my training record and issue my certificate when approved.",
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Could not request certificate review");
      }
      setReviewMessage({ type: "success", text: `Certificate review request sent. Ticket ID: ${result.ticketId}` });
    } catch (error) {
      setReviewMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Could not request certificate review.",
      });
    } finally {
      setRequestingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
        <p className="mt-1 text-sm text-gray-500">Your issued and pending completion certificates.</p>
      </div>
      {error && (
        <Card className="mb-4 border border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}
      {eligibility ? (
        <Card className="mb-4 border-0 bg-white shadow-sm">
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Certification Readiness</p>
                <p className="text-lg font-semibold text-gray-900">{eligibility.completionPercent}% complete</p>
              </div>
              <Badge className={eligibility.eligible ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                {eligibility.eligible ? "eligible" : "in progress"}
              </Badge>
            </div>
            <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-3">
              <p>Hours: {eligibility.completedHours}/{eligibility.totalHours}</p>
              <p>Modules: {eligibility.modulesCompleted}/{eligibility.modulesRequired || 0}</p>
              <p>Access: {eligibility.accessLevel.replace("_", " ")}</p>
            </div>
            {!eligibility.eligible && eligibility.reasons.length > 0 ? (
              <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                {eligibility.reasons.map((reason) => (
                  <p key={reason}>{reason}</p>
                ))}
              </div>
            ) : null}
            {reviewMessage ? (
              <div
                className={`rounded-lg p-4 text-sm ${
                  reviewMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {reviewMessage.text}
              </div>
            ) : null}
            {eligibility.eligible && certificates.length === 0 ? (
              <div className="flex flex-col gap-3 rounded-lg border border-green-100 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-green-900">Ready for certificate review</p>
                  <p className="text-sm text-green-700">Send a request to the school team so they can verify and issue your certificate.</p>
                </div>
                <Button className="bg-green-700 text-white hover:bg-green-800" disabled={requestingReview} onClick={requestCertificateReview}>
                  {requestingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Request review
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      <div className="space-y-4">
        {loading ? (
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-6 text-sm text-gray-500">Loading certificates...</CardContent>
          </Card>
        ) : certificates.length === 0 ? (
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-6 text-sm text-gray-500">No certificate has been issued for this student yet.</CardContent>
          </Card>
        ) : (
          certificates.map((certificate) => (
            <Card key={certificate.id} className="border-0 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-orange-500" />
                  {certificate.course}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Certificate ID</p>
                  <p className="font-medium text-gray-900">{certificate.certificateId}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Issued {new Date(certificate.issuedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={certificate.status === "ISSUED" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                    {certificate.status.toLowerCase()}
                  </Badge>
                  <Button asChild>
                    <a href={`/api/certificates/${certificate.id}/download`}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
