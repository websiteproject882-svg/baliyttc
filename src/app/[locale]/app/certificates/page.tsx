"use client";

import { useEffect, useState } from "react";
import { Award, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<Array<{ id: string; certificateId: string; course: string; status: string; issuedAt: string }>>([]);
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
    void fetch("/api/app/portal")
      .then((response) => response.json())
      .then((result) => {
        setCertificates(result.certificates || []);
        setEligibility(result.certificateEligibility || null);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
        <p className="mt-1 text-sm text-gray-500">Your issued and pending completion certificates.</p>
      </div>
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
          </CardContent>
        </Card>
      ) : null}
      <div className="space-y-4">
        {certificates.length === 0 ? (
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
