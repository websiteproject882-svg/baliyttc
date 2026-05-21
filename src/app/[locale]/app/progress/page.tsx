"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type PortalProgress = {
  student: {
    accessLevel: "NONE" | "PRE_ARRIVAL" | "FULL" | "ALUMNI";
    completedHours: number;
    totalHours: number;
  };
  progress: Array<{
    id: string;
    moduleId: string;
    moduleTitle: string;
    completed: boolean;
    completedAt?: string | null;
    notes: string;
    hours: number;
  }>;
};

export default function StudentProgressPage() {
  const [portal, setPortal] = useState<PortalProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadPortal = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/app/portal");
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to load progress");
      }
      setPortal(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPortal();
  }, []);

  const progressPercent = useMemo(() => {
    if (!portal || portal.student.totalHours <= 0) {
      return 0;
    }
    return Math.round((portal.student.completedHours / portal.student.totalHours) * 100);
  }, [portal]);

  const updateProgress = async (moduleId: string, completed: boolean, notes: string) => {
    setSavingId(moduleId);
    try {
      await fetch(`/api/app/modules/${moduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed, notes }),
      });
      await loadPortal();
    } finally {
      setSavingId(null);
    }
  };

  if (loading || !portal) {
    return <div className="p-8 text-gray-500">{loading ? "Loading progress..." : "Progress unavailable"}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="mb-6 border-0 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Module Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex justify-between text-sm text-gray-600">
            <span>Completed hours</span>
            <span>{portal.student.completedHours}/{portal.student.totalHours}</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          {portal.student.accessLevel !== "FULL" ? (
            <p className="mt-3 text-sm text-gray-500">Module completion tracking unlocks after full access is active.</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {portal.progress.map((module) => (
          <Card key={module.moduleId} className="border-0 bg-white shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${module.completed ? "text-green-600" : "text-gray-400"}`} />
                    <h2 className="font-semibold text-gray-900">{module.moduleTitle}</h2>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {module.hours > 0 ? `${module.hours} hours` : "Hours not defined"}
                    {module.completedAt ? ` - Completed ${new Date(module.completedAt).toLocaleDateString("en-US")}` : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  disabled={portal.student.accessLevel !== "FULL" || savingId === module.moduleId}
                  onClick={() => updateProgress(module.moduleId, !module.completed, module.notes)}
                >
                  {savingId === module.moduleId ? <Loader2 className="h-4 w-4 animate-spin" /> : module.completed ? "Mark Incomplete" : "Mark Complete"}
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Module Notes</label>
                <textarea
                  className="min-h-[110px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none ring-0"
                  value={module.notes}
                  disabled={portal.student.accessLevel !== "FULL"}
                  onChange={(e) => {
                    setPortal((current) =>
                      current
                        ? {
                            ...current,
                            progress: current.progress.map((item) =>
                              item.moduleId === module.moduleId ? { ...item, notes: e.target.value } : item,
                            ),
                          }
                        : current,
                    );
                  }}
                />
                <Button
                  className="bg-orange-500 text-white hover:bg-orange-600"
                  disabled={portal.student.accessLevel !== "FULL" || savingId === module.moduleId}
                  onClick={() => updateProgress(module.moduleId, module.completed, module.notes)}
                >
                  {savingId === module.moduleId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
