"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Calendar, Users, DollarSign, Clock, Loader2, Edit, Trash2, Settings
} from "lucide-react";

interface CourseOption {
  id: string;
  name: string;
  slug: string;
}

interface Accommodation {
  type: "SHARED" | "PRIVATE";
  price: string;
  mandatory: boolean;
}

interface Batch {
  id: string;
  name: string;
  courseId: string;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolled: number;
  status: string;
  priceRegular: number;
  priceEarlyBird: number | null;
  earlyBirdDeadline: string | null;
  waitlistEnabled: boolean;
  course?: {
    name: string;
  };
  accommodation?: Accommodation[];
}

interface BatchForm {
  id: string;
  courseId: string;
  name: string;
  startDate: string;
  endDate: string;
  capacity: string;
  priceRegular: string;
  priceEarlyBird: string;
  earlyBirdDeadline: string;
  status: string;
  waitlistEnabled: boolean;
  accommodation: Accommodation[];
}

const defaultBatchForm: BatchForm = {
  id: "",
  courseId: "",
  name: "",
  startDate: "",
  endDate: "",
  capacity: "20",
  priceRegular: "0",
  priceEarlyBird: "",
  earlyBirdDeadline: "",
  status: "DRAFT",
  waitlistEnabled: false,
  accommodation: [
    { type: "SHARED", price: "0", mandatory: false },
    { type: "PRIVATE", price: "0", mandatory: false },
  ],
};

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<BatchForm>(defaultBatchForm);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [batchesRes, coursesRes] = await Promise.all([
        fetch("/api/admin/batches", { cache: "no-store" }),
        fetch("/api/admin/courses", { cache: "no-store" }),
      ]);
      const [batchesData, coursesData] = await Promise.all([
        batchesRes.json(),
        coursesRes.json(),
      ]);
      setBatches(batchesData.batches || []);
      setCourses(coursesData.courses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openCreateDialog = () => {
    setForm(defaultBatchForm);
    setDialogOpen(true);
  };

  const openEditDialog = (batch: Batch) => {
    setForm({
      id: batch.id,
      courseId: batch.courseId,
      name: batch.name,
      startDate: batch.startDate.split("T")[0],
      endDate: batch.endDate.split("T")[0],
      capacity: String(batch.capacity),
      priceRegular: String(batch.priceRegular),
      priceEarlyBird: batch.priceEarlyBird ? String(batch.priceEarlyBird) : "",
      earlyBirdDeadline: batch.earlyBirdDeadline ? batch.earlyBirdDeadline.split("T")[0] : "",
      status: batch.status,
      waitlistEnabled: batch.waitlistEnabled,
      accommodation: batch.accommodation?.map((a) => ({
        type: a.type,
        price: a.price,
        mandatory: a.mandatory,
      })) || defaultBatchForm.accommodation,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        priceRegular: Number(form.priceRegular),
        priceEarlyBird: form.priceEarlyBird ? Number(form.priceEarlyBird) : null,
        earlyBirdDeadline: form.earlyBirdDeadline || null,
        accommodation: form.accommodation.map((item) => ({
          type: item.type,
          price: Number(item.price),
          mandatory: item.mandatory,
        })),
      };
      const response = await fetch("/api/admin/batches", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.id ? payload : { ...payload, id: undefined }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save batch");
      }
      setDialogOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save batch");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this batch?")) return;
    setError(null);
    try {
      const response = await fetch(`/api/admin/batches?id=${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete batch");
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete batch");
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-700",
      OPEN: "bg-green-100 text-green-800",
      FULL: "bg-amber-100 text-amber-800",
      CLOSED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage training batches</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Batch
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-red-700 text-sm">{error}</CardContent>
        </Card>
      )}

      {/* Batch List */}
      <div className="grid gap-4">
        {batches.length === 0 ? (
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No batches created yet</p>
              <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Batch
              </Button>
            </CardContent>
          </Card>
        ) : (
          batches.map((batch) => (
            <Card key={batch.id} className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{batch.name}</h3>
                      <Badge className={getStatusBadge(batch.status)}>{batch.status}</Badge>
                      {batch.waitlistEnabled && (
                        <Badge variant="outline">Waitlist</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      {batch.course?.name || "Unknown Course"}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(batch.startDate)} - {formatDate(batch.endDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{batch.enrolled}/{batch.capacity} enrolled</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span>{formatCurrency(batch.priceRegular)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(batch)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(batch.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                {/* Enrollment Progress */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Capacity</span>
                    <span>{Math.round((batch.enrolled / batch.capacity) * 100)}% full</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        batch.enrolled >= batch.capacity
                          ? "bg-red-500"
                          : batch.enrolled >= batch.capacity * 0.8
                          ? "bg-amber-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(100, (batch.enrolled / batch.capacity) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Early Bird Pricing */}
                {batch.priceEarlyBird && batch.earlyBirdDeadline && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">Early Bird Pricing</span>
                      </div>
                      <span className="text-sm font-bold text-amber-800">
                        {formatCurrency(batch.priceEarlyBird)}
                      </span>
                    </div>
                    <p className="text-xs text-amber-600 mt-1">
                      Until {formatDate(batch.earlyBirdDeadline)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Batch" : "Create New Batch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Course</label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                >
                  <option value="">Select course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Batch Name</label>
                <Input
                  placeholder="e.g., March 2026"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Capacity</label>
                <Input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Price (USD)</label>
                <Input
                  type="number"
                  min="0"
                  value={form.priceRegular}
                  onChange={(e) => setForm({ ...form, priceRegular: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="OPEN">Open</option>
                  <option value="FULL">Full</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Early Bird Price</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Optional"
                  value={form.priceEarlyBird}
                  onChange={(e) => setForm({ ...form, priceEarlyBird: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Early Bird Deadline</label>
                <Input
                  type="date"
                  value={form.earlyBirdDeadline}
                  onChange={(e) => setForm({ ...form, earlyBirdDeadline: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="waitlist"
                checked={form.waitlistEnabled}
                onChange={(e) => setForm({ ...form, waitlistEnabled: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="waitlist" className="text-sm text-gray-700">
                Enable waitlist when batch is full
              </label>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Accommodation Prices</label>
              <div className="grid grid-cols-3 gap-4">
                {form.accommodation.map((acc, index) => (
                  <div key={acc.type} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{acc.type}</span>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Price"
                      className="mb-1"
                      value={acc.price}
                      onChange={(e) => {
                        const updated = [...form.accommodation];
                        updated[index].price = e.target.value;
                        setForm({ ...form, accommodation: updated });
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`mandatory-${acc.type}`}
                        checked={acc.mandatory}
                        onChange={(e) => {
                          const updated = [...form.accommodation];
                          updated[index].mandatory = e.target.checked;
                          setForm({ ...form, accommodation: updated });
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`mandatory-${acc.type}`} className="text-xs text-gray-600">
                        Required
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  {form.id ? "Update Batch" : "Create Batch"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
