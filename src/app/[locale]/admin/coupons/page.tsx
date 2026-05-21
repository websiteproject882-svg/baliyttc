"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tag, Plus, Search, Edit, Trash2, Loader2, Copy, CheckCircle, Percent, Clock
} from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discount: number;
  minAmount: number | null;
  maxDiscount: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE" as Coupon["discountType"],
    discount: "",
    minAmount: "",
    maxDiscount: "",
    maxUses: "",
    validUntil: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/coupons");
      const data = await response.json();
      setCoupons(data.coupons || []);
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCoupons();
  }, []);

  const handleSubmit = async () => {
    if (!form.code || !form.discount) return;
    setSubmitting(true);
    try {
      const payload = {
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discount: Number(form.discount),
        minAmount: form.minAmount ? Number(form.minAmount) : null,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        validUntil: form.validUntil || null,
        isActive: form.isActive,
      };
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setDialogOpen(false);
        setForm({ code: "", discountType: "PERCENTAGE", discount: "", minAmount: "", maxDiscount: "", maxUses: "", validUntil: "", isActive: true });
        await fetchCoupons();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
      await fetchCoupons();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const filteredCoupons = coupons.filter(c =>
    !search ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.isActive).length,
    totalUsed: coupons.reduce((sum, c) => sum + c.usedCount, 0),
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coupons & Discounts</h1>
            <p className="text-sm text-gray-500 mt-1">Manage promotional codes and discounts</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Coupon
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Coupons</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              <p className="text-sm text-gray-500">Active</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.totalUsed}</p>
              <p className="text-sm text-gray-500">Times Used</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by coupon code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Coupons List */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {filteredCoupons.length === 0 ? (
              <div className="p-12 text-center">
                <Tag className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No coupons found</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredCoupons.map((coupon) => (
                  <div key={coupon.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                          %
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{coupon.code}</h3>
                            <Badge className={coupon.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                              {coupon.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {coupon.discountType === "PERCENTAGE" ? (
                              <Badge className="bg-blue-100 text-blue-700">{coupon.discount}% OFF</Badge>
                            ) : (
                              <Badge className="bg-purple-100 text-purple-700">${coupon.discount} OFF</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{coupon.usedCount} used</span>
                            {coupon.maxUses && <span>of {coupon.maxUses}</span>}
                            {coupon.minAmount && <span>Min: ${coupon.minAmount}</span>}
                            <span>Expires: {coupon.validUntil ? formatDate(coupon.validUntil) : "Never"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => copyCode(coupon.code)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(coupon.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Coupon Code</label>
                <Input
                  placeholder="SAVE20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="font-mono"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Discount Type</label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={form.discountType}
                  onChange={(e) => setForm({ ...form, discountType: e.target.value as Coupon["discountType"] })}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount ($)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {form.discountType === "PERCENTAGE" ? "Discount %" : "Discount $"}
                </label>
                <Input
                  type="number"
                  placeholder={form.discountType === "PERCENTAGE" ? "20" : "100"}
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Max Discount</label>
                <Input
                  type="number"
                  placeholder="Optional"
                  value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Min. Order Amount</label>
                <Input
                  type="number"
                  placeholder="Optional"
                  value={form.minAmount}
                  onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Max Uses</label>
                <Input
                  type="number"
                  placeholder="Unlimited"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Valid Until</label>
              <Input
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleSubmit()} disabled={submitting || !form.code || !form.discount}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Tag className="h-4 w-4 mr-2" />}
              Create Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
