"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Lock, PlayCircle, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PortalData = {
  student: {
    accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI";
    enrolledCourse?: string | null;
    batch?: { course?: { name: string } | null } | null;
  };
  progress: Array<{
    moduleId: string;
    moduleTitle: string;
    completed: boolean;
    hours: number;
  }>;
  resources: Array<{
    id: string;
    title: string;
    description?: string | null;
    url: string;
    type: "LINK" | "DOCUMENT" | "VIDEO" | "COMMUNITY";
    audience: "PRE_ARRIVAL" | "FULL" | "ALUMNI" | "ALL_ACTIVE";
  }>;
};

function youtubeEmbedUrl(url: string) {
  const match =
    url.match(/[?&]v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/youtube\.com\/embed\/([^?]+)/);
  return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function VideoLessonsPage() {
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/app/portal", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to load video lessons");
        }
        return result;
      })
      .then(setPortal)
      .catch((error) => setError(error instanceof Error ? error.message : "Failed to load video lessons"))
      .finally(() => setLoading(false));
  }, []);

  const videoResources = useMemo(
    () =>
      (portal?.resources || []).filter((resource) => {
        if (resource.type !== "VIDEO") return false;
        if (portal?.student.accessLevel === "FULL") return ["FULL", "ALL_ACTIVE", "PRE_ARRIVAL"].includes(resource.audience);
        return ["PRE_ARRIVAL", "ALL_ACTIVE"].includes(resource.audience);
      }),
    [portal?.resources, portal?.student.accessLevel],
  );

  const fullAccess = portal?.student.accessLevel === "FULL";

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-8 text-sm text-gray-500">Loading video lessons...</div>;
  }

  if (!portal) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Card className="border border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4 text-sm text-red-700">{error || "Video lessons unavailable"}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {error && (
        <Card className="mb-4 border border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Video Lessons</h1>
          <p className="text-sm text-gray-500">
            {portal.student.batch?.course?.name || portal.student.enrolledCourse || "Yoga Teacher Training"} modules and protected video resources.
          </p>
        </div>
        <Badge className={fullAccess ? "w-fit bg-green-100 text-green-800" : "w-fit bg-blue-100 text-blue-800"}>
          {fullAccess ? "Full access" : "Pre-arrival only"}
        </Badge>
      </div>

      {!fullAccess ? (
        <Card className="mb-6 border-0 bg-white shadow-sm">
          <CardContent className="flex gap-3 p-5 text-sm text-gray-600">
            <Lock className="h-5 w-5 shrink-0 text-blue-500" />
            Deposit access includes pre-arrival resources. Full module video lessons unlock after full payment confirmation.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="h-5 w-5 text-orange-500" />
              Protected Video Library
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {videoResources.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-6 text-sm text-gray-500">
                Your video library is being prepared. Any pre-arrival or full-course lessons assigned to your batch will appear here.
              </div>
            ) : (
              videoResources.map((resource) => {
                const embedUrl = youtubeEmbedUrl(resource.url);
                return (
                  <div key={resource.id} className="overflow-hidden rounded-lg border border-gray-100">
                    {embedUrl ? (
                      <iframe
                        className="aspect-video w-full"
                        src={embedUrl}
                        title={resource.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex min-h-40 items-center justify-center bg-gray-50 text-sm text-orange-600">
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Open protected video
                      </a>
                    )}
                    <div className="p-4">
                      <p className="font-semibold text-gray-900">{resource.title}</p>
                      {resource.description && <p className="mt-1 text-sm text-gray-500">{resource.description}</p>}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-orange-500" />
              Modules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {portal.progress.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">Your course modules will appear here once your syllabus is assigned.</div>
            ) : (
              portal.progress.map((module, index) => (
                <div key={module.moduleId} className="rounded-lg border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Week / Module {index + 1}</p>
                      <p className="mt-1 font-medium text-gray-900">{module.moduleTitle}</p>
                      <p className="mt-1 text-xs text-gray-500">{module.hours || 0} hours</p>
                    </div>
                    <Badge className={module.completed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                      {module.completed ? "done" : "open"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
