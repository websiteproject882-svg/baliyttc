"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Plus, Trash2, Edit, ChevronLeft, ChevronRight, Sun, Moon, Star, Flower } from "lucide-react";

interface Ceremony {
  id: string;
  name: string;
  date: string;
  description: string;
  type: "full_moon" | "new_moon" | "temple" | "graduation" | "special";
  noClass: boolean;
  batchIds: string[];
}

const ceremonyIcons = {
  full_moon: Moon,
  new_moon: Star,
  temple: Flower,
  graduation: Star,
  special: Sun,
} as const;

const ceremonyColors = {
  full_moon: "bg-purple-100 text-purple-700 border-purple-200",
  new_moon: "bg-gray-100 text-gray-700 border-gray-200",
  temple: "bg-orange-100 text-orange-700 border-orange-200",
  graduation: "bg-green-100 text-green-700 border-green-200",
  special: "bg-amber-100 text-amber-700 border-amber-200",
} as const;

const ceremonyLabels = {
  full_moon: "Full Moon Ceremony",
  new_moon: "New Moon Ceremony",
  temple: "Temple Visit",
  graduation: "Graduation",
  special: "Special Ceremony",
} as const;

export default function CalendarPage() {
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCeremony, setSelectedCeremony] = useState<Ceremony | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date: "",
    description: "",
    type: "temple" as Ceremony["type"],
    noClass: true,
  });

  const fetchCeremonies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/ceremonies");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch ceremonies");
      }
      setCeremonies(Array.isArray(data.ceremonies) ? data.ceremonies : []);
    } catch (err) {
      console.error("Failed to fetch ceremonies:", err);
      setCeremonies([]);
      setError(err instanceof Error ? err.message : "Failed to fetch ceremonies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCeremonies();
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.date) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/ceremonies", {
        method: selectedCeremony ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(selectedCeremony ? { id: selectedCeremony.id } : {}),
          name: form.name,
          date: form.date,
          description: form.description,
          type: form.type,
          noClass: form.noClass,
          batchIds: selectedCeremony?.batchIds || [],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save ceremony");
      }
      setDialogOpen(false);
      setSelectedCeremony(null);
      setForm({ name: "", date: "", description: "", type: "temple", noClass: true });
      await fetchCeremonies();
    } catch (err) {
      console.error("Failed to save ceremony:", err);
      setError(err instanceof Error ? err.message : "Failed to save ceremony");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ceremony?")) return;
    setError(null);
    try {
      const response = await fetch(`/api/admin/ceremonies?id=${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete ceremony");
      }
      await fetchCeremonies();
    } catch (err) {
      console.error("Failed to delete ceremony:", err);
      setError(err instanceof Error ? err.message : "Failed to delete ceremony");
    }
  };

  const handleEdit = (ceremony: Ceremony) => {
    setSelectedCeremony(ceremony);
    setForm({
      name: ceremony.name,
      date: ceremony.date,
      description: ceremony.description,
      type: ceremony.type,
      noClass: ceremony.noClass,
    });
    setDialogOpen(true);
  };

  const openNewDialog = () => {
    setSelectedCeremony(null);
    setForm({ name: "", date: "", description: "", type: "temple", noClass: true });
    setDialogOpen(true);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Array<Date | null> = [];
    for (let index = 0; index < firstDay.getDay(); index += 1) days.push(null);
    for (let day = 1; day <= lastDay.getDate(); day += 1) days.push(new Date(year, month, day));
    return days;
  };

  const getCeremoniesForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return ceremonies.filter((ceremony) => ceremony.date === dateStr);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = getDaysInMonth(currentDate);
  const upcomingCeremonies = ceremonies.filter((ceremony) => new Date(ceremony.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  if (loading && ceremonies.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ceremony Calendar</h1>
            <p className="text-sm text-gray-500 mt-1">Schedule ceremonies and no-class days</p>
          </div>
          <Button onClick={openNewDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Ceremony
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <Card className="border border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-bold text-gray-900">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {dayNames.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`} className="h-20" />;
                    const dayCeremonies = getCeremoniesForDate(day);
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <div key={day.toISOString()} className={`h-20 rounded-lg border p-1 transition-colors ${isToday ? "bg-orange-50 border-orange-300" : "bg-white border-gray-200 hover:border-orange-200"}`}>
                        <div className="flex items-start justify-between">
                          <span className={`text-sm font-medium ${isToday ? "text-orange-600" : "text-gray-700"}`}>{day.getDate()}</span>
                        </div>
                        <div className="mt-1 space-y-1">
                          {dayCeremonies.slice(0, 2).map((ceremony) => {
                            const Icon = ceremonyIcons[ceremony.type];
                            return (
                              <div key={ceremony.id} className={`text-xs p-1 rounded flex items-center gap-1 ${ceremonyColors[ceremony.type]}`}>
                                <Icon className="h-3 w-3" />
                                <span className="truncate">{ceremony.name}</span>
                              </div>
                            );
                          })}
                          {dayCeremonies.length > 2 && <p className="text-xs text-gray-500">+{dayCeremonies.length - 2} more</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Ceremonies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingCeremonies.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No upcoming ceremonies</p>
                ) : (
                  upcomingCeremonies.map((ceremony) => {
                    const Icon = ceremonyIcons[ceremony.type];
                    return (
                      <div key={ceremony.id} className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${ceremonyColors[ceremony.type]}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">{ceremony.name}</p>
                            <p className="text-xs text-gray-500">{formatDate(ceremony.date)}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{ceremonyLabels[ceremony.type]}</Badge>
                              {ceremony.noClass && <Badge className="bg-red-100 text-red-700 text-xs">No Class</Badge>}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(ceremony)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => void handleDelete(ceremony.id)}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Ceremony Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(ceremonyLabels).map(([type, label]) => {
                  const Icon = ceremonyIcons[type as keyof typeof ceremonyIcons];
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${ceremonyColors[type as keyof typeof ceremonyColors]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm text-gray-700">{label}</span>
                    </div>
                  );
                })}
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-red-100">
                      <CalendarIcon className="h-4 w-4 text-red-700" />
                    </div>
                    <span className="text-sm text-gray-700">No Class Day</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedCeremony ? "Edit Ceremony" : "Add New Ceremony"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Ceremony Name *</label>
              <Input placeholder="e.g., Full Moon Ceremony" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Date *</label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
              <select className="w-full rounded-lg border px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Ceremony["type"] })}>
                <option value="full_moon">Full Moon Ceremony</option>
                <option value="new_moon">New Moon Ceremony</option>
                <option value="temple">Temple Visit</option>
                <option value="graduation">Graduation</option>
                <option value="special">Special Ceremony</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
              <textarea className="w-full rounded-lg border px-3 py-2 min-h-[80px]" placeholder="Optional description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleSave()} disabled={saving || !form.name || !form.date}>
              {selectedCeremony ? "Update" : "Add"} Ceremony
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
