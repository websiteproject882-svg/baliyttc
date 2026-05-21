"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, FileText, Loader2, MapPinned, Plane, ShieldCheck, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PortalData = {
  student: {
    accessLevel: "PRE_ARRIVAL" | "FULL" | "ALUMNI" | "NONE";
    batch?: { startDate?: string | null; course?: { name: string } | null } | null;
  };
  tasks: Array<{ id: string; taskKey: string; taskTitle: string; completed: boolean }>;
  resources: Array<{
    id: string;
    title: string;
    description?: string | null;
    url: string;
    type: "LINK" | "DOCUMENT" | "VIDEO" | "COMMUNITY";
    audience: string;
    taskKey?: string | null;
  }>;
};

const fallbackGuides = [
  {
    title: "Bali Visa Guide for European Students",
    description: "Check passport validity, visa-on-arrival eligibility, return ticket, and local extension rules before travel.",
    icon: ShieldCheck,
  },
  {
    title: "Packing Checklist",
    description: "Light yoga clothes, refillable bottle, journal, travel adapter, sunscreen, mosquito repellent, and personal medication.",
    icon: Plane,
  },
  {
    title: "Arrival Preparation",
    description: "Share arrival details with the school team, keep payment proof handy, and save the campus location offline.",
    icon: MapPinned,
  },
];

export default function PreArrivalPage() {
  const [portal, setPortal] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/app/portal")
      .then((response) => response.json())
      .then(setPortal)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const preArrivalResources = useMemo(() => {
    if (!portal) return [];
    return portal.resources.filter((resource) => ["PRE_ARRIVAL", "ALL_ACTIVE"].includes(resource.audience));
  }, [portal]);

  const completedTasks = portal?.tasks.filter((task) => task.completed).length || 0;

  const toggleTask = async (taskKey: string, completed: boolean) => {
    setToggling(taskKey);
    setActionMessage(null);
    try {
      const update = await fetch(`/api/app/tasks/${taskKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      if (!update.ok) {
        const result = await update.json().catch(() => ({}));
        throw new Error(result.error || "Could not update checklist");
      }
      const response = await fetch("/api/app/portal");
      setPortal(await response.json());
      setActionMessage(completed ? "Checklist item reopened." : "Checklist item completed.");
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Could not update checklist.");
    } finally {
      setToggling(null);
    }
  };

  if (loading || !portal) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pre-Arrival Portal</h1>
          <p className="text-sm text-gray-500">Unlocked after deposit payment. Complete these before arriving in Bali.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="w-fit bg-blue-50 text-blue-700 hover:bg-blue-50">
            {portal.student.accessLevel === "PRE_ARRIVAL" ? "Deposit access" : "Full access"}
          </Badge>
          <Badge variant="outline" className="w-fit bg-white">
            {completedTasks}/{portal.tasks.length} checklist done
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-0 bg-white shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-orange-500" />
              Preparation Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionMessage && (
              <div className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-700">
                {actionMessage}
              </div>
            )}
            {portal.tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                <CheckCircle2 className={`h-5 w-5 ${task.completed ? "text-green-600" : "text-gray-300"}`} />
                <p className={`min-w-0 flex-1 text-sm ${task.completed ? "text-gray-500 line-through" : "font-medium text-gray-900"}`}>
                  {task.taskTitle}
                </p>
                <Button
                  size="sm"
                  variant={task.completed ? "outline" : "default"}
                  className={task.completed ? "" : "bg-orange-500 text-white hover:bg-orange-600"}
                  disabled={toggling === task.taskKey}
                  onClick={() => toggleTask(task.taskKey, task.completed)}
                >
                  {toggling === task.taskKey ? <Loader2 className="h-4 w-4 animate-spin" /> : task.completed ? "Undo" : "Done"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPinned className="h-5 w-5 text-orange-500" />
              Travel Essentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fallbackGuides.map((guide) => {
              const Icon = guide.icon;
              return (
                <div key={guide.title} className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-orange-500" />
                    <p className="text-sm font-semibold text-gray-900">{guide.title}</p>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{guide.description}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-0 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-orange-500" />
            Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {preArrivalResources.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500 md:col-span-2">
              Course manual, prep videos, and travel documents will appear here once admin publishes them.
            </div>
          ) : (
            preArrivalResources.map((resource) => {
              const Icon = resource.type === "VIDEO" ? Video : FileText;
              return (
                <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" className="group rounded-lg border border-gray-100 p-4 hover:border-orange-200">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-orange-50 p-2">
                      <Icon className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">{resource.title}</p>
                      {resource.description && <p className="mt-1 text-sm text-gray-500">{resource.description}</p>}
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-orange-500" />
                  </div>
                </a>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
