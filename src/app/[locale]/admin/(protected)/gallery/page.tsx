"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Image as ImageIcon, Plus, Search, Trash2, Eye, ExternalLink, Star as StarIcon, Edit } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
  category: "Practice" | "Ceremony" | "Campus" | "Nature" | "Teachers" | "Courses";
  type: "PROFESSIONAL" | "STUDENT";
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE";
  order: number;
  createdAt: string;
}

const galleryCategories: GalleryImage["category"][] = ["Practice", "Ceremony", "Campus", "Nature", "Teachers", "Courses"];

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "PROFESSIONAL" | "STUDENT">("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [form, setForm] = useState({
    url: "",
    alt: "",
    caption: "",
    category: "Practice" as GalleryImage["category"],
    type: "PROFESSIONAL" as GalleryImage["type"],
    status: "ACTIVE" as GalleryImage["status"],
    order: "0",
  });
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/gallery", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch gallery");
      }
      setImages(Array.isArray(data.images) ? data.images : []);
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
      setImages([]);
      setError(err instanceof Error ? err.message : "Failed to fetch gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchImages();
  }, []);

  const handleUpload = async () => {
    if (!form.url) return;
    setUploading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create gallery image");
      }
      setShowUploadDialog(false);
      setForm({ url: "", alt: "", caption: "", category: "Practice", type: "PROFESSIONAL", status: "ACTIVE", order: "0" });
      await fetchImages();
    } catch (err) {
      console.error("Failed to create gallery image:", err);
      setError(err instanceof Error ? err.message : "Failed to create gallery image");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    setActionLoading(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/gallery?id=${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete image");
      }
      await fetchImages();
    } catch (err) {
      console.error("Failed to delete image:", err);
      setError(err instanceof Error ? err.message : "Failed to delete image");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (image: GalleryImage, status: GalleryImage["status"]) => {
    setActionLoading(image.id);
    setError(null);
    try {
      const response = await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: image.id, status }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update image");
      }
      await fetchImages();
    } catch (err) {
      console.error("Failed to update image:", err);
      setError(err instanceof Error ? err.message : "Failed to update image");
    } finally {
      setActionLoading(null);
    }
  };

  const openAddDialog = () => {
    setForm({ url: "", alt: "", caption: "", category: "Practice", type: "PROFESSIONAL", status: "ACTIVE", order: "0" });
    setShowUploadDialog(true);
  };

  const openEditDialog = (image: GalleryImage) => {
    setSelectedImage(null);
    setEditingImage(image);
    setForm({
      url: image.url,
      alt: image.alt || "",
      caption: image.caption || "",
      category: image.category || "Practice",
      type: image.type,
      status: image.status,
      order: String(image.order || 0),
    });
  };

  const handleUpdateImage = async () => {
    if (!editingImage || !form.url) return;
    setUploading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingImage.id,
          url: form.url,
          alt: form.alt,
          caption: form.caption,
          category: form.category,
          type: form.type,
          status: form.status,
          order: form.order,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update gallery image");
      }
      setEditingImage(null);
      setForm({ url: "", alt: "", caption: "", category: "Practice", type: "PROFESSIONAL", status: "ACTIVE", order: "0" });
      await fetchImages();
    } catch (err) {
      console.error("Failed to update gallery image:", err);
      setError(err instanceof Error ? err.message : "Failed to update gallery image");
    } finally {
      setUploading(false);
    }
  };

  const filteredImages = images.filter((image) => {
    const matchSearch =
      !search ||
      (image.alt || "").toLowerCase().includes(search.toLowerCase()) ||
      (image.caption || "").toLowerCase().includes(search.toLowerCase()) ||
      (image.category || "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || image.type === typeFilter;
    return matchSearch && matchType;
  });

  const activeImages = images.filter((image) => image.status === "ACTIVE" || image.status === "APPROVED");
  const pendingImages = images.filter((image) => image.status === "PENDING");

  if (loading && images.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => <Skeleton key={index} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
            <p className="text-sm text-gray-500 mt-1">Manage photos and images for your website</p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Image
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <Card className="border border-red-200 bg-red-50 shadow-sm">
            <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{images.length}</p>
              <p className="text-sm text-gray-500">Total Images</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{activeImages.length}</p>
              <p className="text-sm text-gray-500">Live</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{pendingImages.length}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{images.filter((image) => image.type === "STUDENT").length}</p>
              <p className="text-sm text-gray-500">Student Uploads</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search images..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
              </div>
              <select className="rounded-lg border px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}>
                <option value="all">All Types</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {pendingImages.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Pending Approval</h2>
                <Badge className="bg-amber-500 text-white">{pendingImages.length}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {pendingImages.map((image) => (
                  <div key={image.id} className="relative group rounded-xl overflow-hidden border border-amber-300">
                    <img src={image.url} alt={image.alt || "Gallery image"} className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => void handleUpdateStatus(image, "APPROVED")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => void handleUpdateStatus(image, "REJECTED")}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            {filteredImages.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No images found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredImages.map((image) => (
                  <div key={image.id} className="relative group rounded-xl overflow-hidden border border-gray-200">
                    <img src={image.url} alt={image.alt || "Gallery image"} className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium truncate">{image.alt || "Untitled image"}</p>
                        {image.caption && <p className="text-white/70 text-xs truncate">{image.caption}</p>}
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 flex gap-2">
                      <Badge variant="secondary">{image.type}</Badge>
                      <Badge variant="outline">{image.category || "Practice"}</Badge>
                      <Badge className={image.status === "ACTIVE" || image.status === "APPROVED" ? "bg-green-500 text-white" : "bg-amber-500 text-white"}>
                        {image.status}
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary">#{image.order}</Badge>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setSelectedImage(image)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => openEditDialog(image)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {(image.status === "ACTIVE" || image.status === "APPROVED") ? (
                        <Button size="sm" variant="secondary" onClick={() => void handleUpdateStatus(image, "PENDING")}>
                          <StarIcon className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => void handleUpdateStatus(image, "ACTIVE")}>
                          <StarIcon className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" disabled={actionLoading === image.id} onClick={() => void handleDelete(image.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Image URL</label>
              <Input placeholder="https://example.com/image.jpg" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Alt Text</label>
              <Input placeholder="Descriptive alt text" value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Caption</label>
              <Input placeholder="Optional caption" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                <select className="w-full rounded-lg border px-3 py-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as GalleryImage["category"] })}>
                  {galleryCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
                <select className="w-full rounded-lg border px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as GalleryImage["type"] })}>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="STUDENT">Student</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <select className="w-full rounded-lg border px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as GalleryImage["status"] })}>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
            {form.url && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                <div className="rounded-lg overflow-hidden border">
                  <img src={form.url} alt="Preview" className="w-full h-40 object-cover" />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button onClick={() => void handleUpload()} disabled={uploading || !form.url}>
              {uploading ? "Adding..." : "Add Image"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.alt || "Gallery Image"}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <img src={selectedImage.url} alt={selectedImage.alt || "Gallery image"} className="w-full max-h-[500px] object-contain rounded-lg" />
              <div className="flex items-center gap-4">
                <Badge variant="secondary">{selectedImage.type}</Badge>
                <Badge variant="outline">{selectedImage.category || "Practice"}</Badge>
                <Badge variant="outline">{selectedImage.status}</Badge>
                {selectedImage.caption && <p className="text-gray-600">{selectedImage.caption}</p>}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => window.open(selectedImage.url, "_blank", "noopener,noreferrer")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Original
                </Button>
                <Button variant="outline" onClick={() => void handleUpdateStatus(selectedImage, selectedImage.status === "ACTIVE" ? "PENDING" : "ACTIVE")}>
                  <StarIcon className="h-4 w-4 mr-2" />
                  {selectedImage.status === "ACTIVE" ? "Move to Pending" : "Set Active"}
                </Button>
                <Button variant="outline" onClick={() => openEditDialog(selectedImage)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingImage} onOpenChange={(open) => !open && setEditingImage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Gallery Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Image URL</label>
              <Input placeholder="https://example.com/image.jpg" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Alt Text</label>
              <Input placeholder="Descriptive alt text" value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Caption</label>
              <Input placeholder="Optional caption" value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                <select className="w-full rounded-lg border px-3 py-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as GalleryImage["category"] })}>
                  {galleryCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Type</label>
                <select className="w-full rounded-lg border px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as GalleryImage["type"] })}>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="STUDENT">Student</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <select className="w-full rounded-lg border px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as GalleryImage["status"] })}>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Order</label>
                <Input type="number" min="0" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
            </div>
            {form.url && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                <div className="rounded-lg overflow-hidden border">
                  <img src={form.url} alt="Preview" className="w-full h-40 object-cover" />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingImage(null)}>Cancel</Button>
            <Button onClick={() => void handleUpdateImage()} disabled={uploading || !form.url}>
              {uploading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
