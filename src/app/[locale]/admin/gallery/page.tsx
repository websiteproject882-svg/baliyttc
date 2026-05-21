"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Image, Plus, Search, Trash2, Edit, CheckCircle, XCircle,
  GripVertical, Upload, Eye, X, ExternalLink
} from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  caption: string;
  category: "training" | "campus" | "ceremony" | "excursion" | "student";
  featured: boolean;
  approved: boolean;
  order: number;
  createdAt: string;
}

const categories = [
  { value: "all", label: "All" },
  { value: "training", label: "Training" },
  { value: "campus", label: "Campus" },
  { value: "ceremony", label: "Ceremony" },
  { value: "excursion", label: "Excursion" },
  { value: "student", label: "Student" },
];

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [form, setForm] = useState({
    url: "",
    alt: "",
    caption: "",
    category: "training" as GalleryImage["category"],
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/gallery");
      const data = await response.json();
      setImages(data.images || []);
    } catch (err) {
      console.error("Failed to fetch gallery:", err);
      // Demo data
      setImages([
        { id: "1", url: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800", alt: "Yoga in Bali", caption: "Morning yoga session", category: "training", featured: true, approved: true, order: 1, createdAt: new Date().toISOString() },
        { id: "2", url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800", alt: "Meditation", caption: "Sunrise meditation", category: "training", featured: true, approved: true, order: 2, createdAt: new Date().toISOString() },
        { id: "3", url: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800", alt: "Bali Temple", caption: "Temple visit ceremony", category: "ceremony", featured: false, approved: true, order: 3, createdAt: new Date().toISOString() },
        { id: "4", url: "https://images.unsplash.com/photo-1544367567-0f3fc350c703?w=800", alt: "Beach Yoga", caption: "Beach practice session", category: "excursion", featured: false, approved: true, order: 4, createdAt: new Date().toISOString() },
        { id: "5", url: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800", alt: "Graduation", caption: "YTTC graduation ceremony", category: "ceremony", featured: true, approved: true, order: 5, createdAt: new Date().toISOString() },
        { id: "6", url: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800", alt: "Rice Fields", caption: "Tegalalang Rice Terraces", category: "campus", featured: false, approved: true, order: 6, createdAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!form.url || !form.alt) return;
    setUploading(true);

    const newImage: GalleryImage = {
      id: `img-${Date.now()}`,
      ...form,
      featured: false,
      approved: true,
      order: images.length + 1,
      createdAt: new Date().toISOString(),
    };

    // In production, this would save to database
    setImages([...images, newImage]);
    setShowUploadDialog(false);
    setForm({ url: "", alt: "", caption: "", category: "training" });
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    setImages(images.filter(img => img.id !== id));
  };

  const handleToggleFeatured = async (id: string) => {
    setImages(images.map(img =>
      img.id === id ? { ...img, featured: !img.featured } : img
    ));
  };

  const filteredImages = images.filter(img => {
    const matchSearch = !search ||
      img.alt.toLowerCase().includes(search.toLowerCase()) ||
      img.caption.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || img.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const featuredImages = images.filter(img => img.featured && img.approved);
  const pendingImages = images.filter(img => !img.approved);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-48" />)}
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
          <Button onClick={() => setShowUploadDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Image
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{images.length}</p>
              <p className="text-sm text-gray-500">Total Images</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{featuredImages.length}</p>
              <p className="text-sm text-gray-500">Featured</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{images.filter(i => i.approved).length}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{pendingImages.length}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search images..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {categories.map(cat => (
                  <Button
                    key={cat.value}
                    variant={categoryFilter === cat.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter(cat.value)}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approval Section */}
        {pendingImages.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <XCircle className="h-5 w-5 text-amber-600" />
                Pending Approval ({pendingImages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {pendingImages.map(img => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden border-2 border-amber-300">
                    <img src={img.url} alt={img.alt} className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleToggleFeatured(img.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(img.id)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <Badge className="absolute top-2 right-2 bg-amber-500">Pending</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gallery Grid */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            {filteredImages.length === 0 ? (
              <div className="text-center py-12">
                <Image className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No images found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredImages.map(img => (
                  <div
                    key={img.id}
                    className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                      img.featured ? "border-orange-500 ring-2 ring-orange-200" : "border-gray-200"
                    }`}
                  >
                    <img src={img.url} alt={img.alt} className="w-full h-40 object-cover" />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-medium truncate">{img.alt}</p>
                        {img.caption && <p className="text-white/70 text-xs truncate">{img.caption}</p>}
                      </div>
                    </div>

                    {/* Featured Badge */}
                    {img.featured && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-orange-500 text-white">
                          <Star className="h-3 w-3 mr-1" /> Featured
                        </Badge>
                      </div>
                    )}

                    {/* Category Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="capitalize">
                        {img.category}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedImage(img)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={img.featured ? "default" : "secondary"}
                        onClick={() => handleToggleFeatured(img.id)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(img.id)}
                      >
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

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Image URL</label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Paste image URL from Unsplash or upload to Firebase Storage</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Alt Text *</label>
              <Input
                placeholder="Descriptive alt text for accessibility"
                value={form.alt}
                onChange={(e) => setForm({ ...form, alt: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Caption</label>
              <Input
                placeholder="Optional caption"
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as GalleryImage["category"] })}
              >
                <option value="training">Training</option>
                <option value="campus">Campus</option>
                <option value="ceremony">Ceremony</option>
                <option value="excursion">Excursion</option>
                <option value="student">Student</option>
              </select>
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
            <Button onClick={() => void handleUpload()} disabled={uploading || !form.url || !form.alt}>
              {uploading ? "Adding..." : "Add Image"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Detail Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.alt}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <img
                src={selectedImage.url}
                alt={selectedImage.alt}
                className="w-full max-h-[500px] object-contain rounded-lg"
              />
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="capitalize">{selectedImage.category}</Badge>
                {selectedImage.featured && <Badge className="bg-orange-500">Featured</Badge>}
                {selectedImage.caption && <p className="text-gray-600">{selectedImage.caption}</p>}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedImage.url, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Original
                </Button>
                <Button
                  variant={selectedImage.featured ? "default" : "outline"}
                  onClick={() => {
                    handleToggleFeatured(selectedImage.id);
                    setSelectedImage({ ...selectedImage, featured: !selectedImage.featured });
                  }}
                >
                  <Star className="h-4 w-4 mr-2" />
                  {selectedImage.featured ? "Remove Featured" : "Set Featured"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Star({ className, ...props }: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
