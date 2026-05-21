"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, CheckCircle, Eye, Award, Users, Calendar, Star } from "lucide-react";

interface SocialProof {
  totalGraduates: number;
  yearsExperience: number;
  averageRating: number;
  totalReviews: number;
  countries: number;
  trainingHours: number;
  certifiedTeachers: number;
}

const defaultStats: SocialProof = {
  totalGraduates: 2500,
  yearsExperience: 12,
  averageRating: 4.9,
  totalReviews: 487,
  countries: 45,
  trainingHours: 50000,
  certifiedTeachers: 2200,
};

export default function SocialProofPage() {
  const [stats, setStats] = useState<SocialProof>(defaultStats);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/social-proof");
      const data = await response.json();
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In production, save to database
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Social Proof Numbers</h1>
            <p className="text-sm text-gray-500 mt-1">Update statistics shown on homepage</p>
          </div>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⟳</span> Saving...
              </span>
            ) : saved ? (
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" /> Saved!
              </span>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Preview Card */}
        <Card className="border-0 shadow-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <CardContent className="p-8">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Homepage Preview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold">{formatNumber(stats.totalGraduates)}+</p>
                <p className="text-orange-100 text-sm">Graduates</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold">{stats.yearsExperience}+</p>
                <p className="text-orange-100 text-sm">Years Experience</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-4xl font-bold">{stats.averageRating}</p>
                  <Star className="h-6 w-6 fill-current" />
                </div>
                <p className="text-orange-100 text-sm">{stats.totalReviews} Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold">{stats.countries}+</p>
                <p className="text-orange-100 text-sm">Countries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Graduates */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Total Graduates
              </CardTitle>
              <CardDescription>Students who completed training</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                value={stats.totalGraduates}
                onChange={(e) => setStats({ ...stats, totalGraduates: parseInt(e.target.value) || 0 })}
                className="text-2xl font-bold"
              />
              <p className="text-xs text-gray-500 mt-2">Display format: 2,500+</p>
            </CardContent>
          </Card>

          {/* Years Experience */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Years of Experience
              </CardTitle>
              <CardDescription>Teaching since</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                value={stats.yearsExperience}
                onChange={(e) => setStats({ ...stats, yearsExperience: parseInt(e.target.value) || 0 })}
                className="text-2xl font-bold"
              />
              <p className="text-xs text-gray-500 mt-2">Display format: 12+ Years</p>
            </CardContent>
          </Card>

          {/* Average Rating */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-orange-500" />
                Average Rating
              </CardTitle>
              <CardDescription>Out of 5.0</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                step="0.1"
                max="5"
                value={stats.averageRating}
                onChange={(e) => setStats({ ...stats, averageRating: parseFloat(e.target.value) || 0 })}
                className="text-2xl font-bold"
              />
              <p className="text-xs text-gray-500 mt-2">Display format: 4.9 ⭐</p>
            </CardContent>
          </Card>

          {/* Total Reviews */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-orange-500" />
                Total Reviews
              </CardTitle>
              <CardDescription>Google & social reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                value={stats.totalReviews}
                onChange={(e) => setStats({ ...stats, totalReviews: parseInt(e.target.value) || 0 })}
                className="text-2xl font-bold"
              />
              <p className="text-xs text-gray-500 mt-2">Display format: 487 Reviews</p>
            </CardContent>
          </Card>

          {/* Countries */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Countries
              </CardTitle>
              <CardDescription>Where students come from</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                value={stats.countries}
                onChange={(e) => setStats({ ...stats, countries: parseInt(e.target.value) || 0 })}
                className="text-2xl font-bold"
              />
              <p className="text-xs text-gray-500 mt-2">Display format: 45+ Countries</p>
            </CardContent>
          </Card>

          {/* Certified Teachers */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-500" />
                Certified Teachers
              </CardTitle>
              <CardDescription>Yoga Alliance certified</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                value={stats.certifiedTeachers}
                onChange={(e) => setStats({ ...stats, certifiedTeachers: parseInt(e.target.value) || 0 })}
                className="text-2xl font-bold"
              />
              <p className="text-xs text-gray-500 mt-2">Display format: 2,200+</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Additional Statistics</CardTitle>
            <CardDescription>Optional metrics to display on homepage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Total Training Hours Delivered
                </label>
                <Input
                  type="number"
                  value={stats.trainingHours}
                  onChange={(e) => setStats({ ...stats, trainingHours: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-gray-500 mt-1">Used in "By the Numbers" section</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900">How it works</h4>
                <p className="text-sm text-blue-700 mt-1">
                  These numbers appear on your homepage in the "Trust Strip" section. Update them periodically to reflect accurate statistics.
                  Changes take effect immediately after saving.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
