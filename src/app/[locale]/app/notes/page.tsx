"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Save, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentNotesPage() {
  const [notes, setNotes] = useState("");
  const [loadedNotes, setLoadedNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/app/notes")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to load notes");
        }
        return result;
      })
      .then((result) => {
        const initial = result.personalNotes || "";
        setNotes(initial);
        setLoadedNotes(initial);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load notes"))
      .finally(() => setLoading(false));
  }, []);

  const saveNotes = useCallback(async (value = notes) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/app/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personalNotes: value }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to save notes");
      }
      setLoadedNotes(value);
      setSavedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setSaving(false);
    }
  }, [notes]);

  useEffect(() => {
    if (loading || notes === loadedNotes) return;
    const timer = window.setTimeout(() => {
      void saveNotes(notes);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [loading, loadedNotes, notes, saveNotes]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <StickyNote className="h-5 w-5 text-orange-500" />
              Personal Notes
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving privately
                </>
              ) : savedAt ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  Saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </>
              ) : (
                "Auto-save is on"
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <textarea
            className="min-h-[55vh] w-full rounded-lg border border-gray-200 p-4 text-sm text-gray-800 outline-none focus:border-orange-300"
            placeholder="Write your reflections, practice notes, travel checklist, and questions here."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
          />
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => saveNotes()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
