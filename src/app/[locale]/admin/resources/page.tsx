"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus, Link, FileText, Video, MessageCircle, Loader2, Edit, Trash2,
  BookOpen, ExternalLink
} from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  type: "LINK" | "DOCUMENT" | "VIDEO" | "COMMUNITY";
  audience: "PRE_ARRIVAL" | "FULL" | "ALUMNI" | "ALL_ACTIVE";
  taskKey: string | null;
  order: number;
  isActive: boolean;
}

interface ResourceForm {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "LINK" | "DOCUMENT" | "VIDEO" | "COMMUNITY";
  audience: "PRE_ARRIVAL" | "FULL" | "ALUMNI" | "ALL_ACTIVE";
  taskKey: string;
  order: string;
  isActive: boolean;
}

const defaultResourceForm: ResourceForm = {
  id: "",
  title: "",
  description: "",
  url: "",
  type: "LINK",
  audience: "PRE_ARRIVAL",
  taskKey: "",
  order: "0",
  isActive: true,
};

const typeConfig = {
  LINK: { icon: Link, color: "text-blue-600 bg-blue-50", label: "Link" },
  DOCUMENT: { icon: FileText, color: "text-purple-600 bg-purple-50", label: "Document" },
  VIDEO: { icon: Video, color: "text-red-600 bg-red-50", label: "Video" },
  COMMUNITY: { icon: MessageCircle, color: "text-green-600 bg-green-50", label: "Community" },
};

const audienceConfig = {
  PRE_ARRIVAL: { label: "Pre-Arrival", color: "bg-amber-100 text-amber-800" },
  FULL: { label: "Full Access", color: "bg-green-100 text-green-800" },
  ALUMNI: { label: "Alumni", color: "bg-blue-100 text-blue-800" },
  ALL_ACTIVE: { label: "All Active", color: "bg-gray-100 text-gray-800" },
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ResourceForm>(defaultResourceForm);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PRE_ARRIVAL" | "FULL" | "ALUMNI">("ALL");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/prearrival-resources", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load resources");
      }
      setResources(data.resources || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openCreateDialog = () => {
    setForm(defaultResourceForm);
    setDialogOpen(true);
  };

  const openEditDialog = (resource: Resource) => {
    setForm({
      id: resource.id,
      title: resource.title,
      description: resource.description || "",
      url: resource.url,
      type: resource.type,
      audience: resource.audience,
      taskKey: resource.taskKey || "",
      order: String(resource.order),
      isActive: resource.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        order: Number(form.order),
        description: form.description || null,
        taskKey: form.taskKey || null,
      };
      const response = await fetch("/api/admin/prearrival-resources", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form.id ? payload : { ...payload, id: undefined }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save resource");
      }
      setDialogOpen(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save resource");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    setError(null);
    try {
      const response = await fetch(`/api/admin/prearrival-resources?id=${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete resource");
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete resource");
    }
  };

  const filteredResources = resources.filter((r) =>
    filter === "ALL" || r.audience === filter
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Pre-Arrival Resources</h1>
          <p className="text-sm text-gray-500 mt-1">Manage student preparation materials and links</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 text-red-700 text-sm">{error}</CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["ALL", "PRE_ARRIVAL", "FULL", "ALUMNI"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "ALL" ? "All" : audienceConfig[f].label}
          </Button>
        ))}
      </div>

      {/* Resource List */}
      <div className="space-y-4">
        {filteredResources.length === 0 ? (
          <Card className="border-0 bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No resources created yet</p>
              <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Resource
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredResources.map((resource) => {
            const TypeIcon = typeConfig[resource.type].icon;
            const typeStyle = typeConfig[resource.type];
            const audienceStyle = audienceConfig[resource.audience];

            return (
              <Card
                key={resource.id}
                className={`border-0 bg-white shadow-sm transition-all ${
                  resource.isActive ? "hover:shadow-md" : "opacity-60"
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-xl p-3 ${typeStyle.color}`}>
                      <TypeIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-gray-900">{resource.title}</h3>
                            {!resource.isActive && (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                            {resource.taskKey && (
                              <Badge variant="outline" className="text-xs">
                                Task: {resource.taskKey}
                              </Badge>
                            )}
                          </div>
                          {resource.description && (
                            <p className="text-sm text-gray-500 mb-2">{resource.description}</p>
                          )}
                          <div className="flex items-center gap-3">
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                            >
                              {resource.url.length > 40 ? resource.url.slice(0, 40) + "..." : resource.url}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={audienceStyle.color}>
                            {audienceStyle.label}
                          </Badge>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(resource)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => void handleDelete(resource.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Resource" : "Add New Resource"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
              <Input
                placeholder="e.g., Welcome Video"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
              <Textarea
                placeholder="Optional description..."
                className="min-h-[80px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">URL</label>
              <Input
                placeholder="https://..."
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as ResourceForm["type"] })}
                >
                  <option value="LINK">Link</option>
                  <option value="DOCUMENT">Document</option>
                  <option value="VIDEO">Video</option>
                  <option value="COMMUNITY">Community</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Audience</label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value as ResourceForm["audience"] })}
                >
                  <option value="PRE_ARRIVAL">Pre-Arrival</option>
                  <option value="FULL">Full Access</option>
                  <option value="ALUMNI">Alumni</option>
                  <option value="ALL_ACTIVE">All Active</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Task Key</label>
                <Input
                  placeholder="e.g., watch_welcome_video"
                  value={form.taskKey}
                  onChange={(e) => setForm({ ...form, taskKey: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Links this resource to a pre-arrival task</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Display Order</label>
                <Input
                  type="number"
                  min="0"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Active (visible to students)
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={submitting || !form.title || !form.url}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : form.id ? (
                "Update Resource"
              ) : (
                "Add Resource"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
