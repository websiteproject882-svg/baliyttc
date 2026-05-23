"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  type: "GENERAL" | "BATCH" | "URGENT";
  createdAt: string;
  reactionCounts: Record<string, number>;
  ownReaction: string | null;
  replies: Array<{
    id: string;
    content: string;
    createdAt: string;
    authorName: string;
    authorPhotoURL: string | null;
    mine: boolean;
  }>;
};

const reactionDisplayByCode: Record<string, string> = {
  PRAY: "\u{1F64F}",
  LOVE: "\u2764\uFE0F",
  LIKE: "\u{1F44D}",
  CELEBRATE: "\u{1F389}",
  FIRE: "\u{1F525}",
};

const reactions = [
  { label: reactionDisplayByCode.PRAY, value: "PRAY" },
  { label: reactionDisplayByCode.LOVE, value: "LOVE" },
  { label: reactionDisplayByCode.LIKE, value: "LIKE" },
  { label: reactionDisplayByCode.CELEBRATE, value: "CELEBRATE" },
  { label: reactionDisplayByCode.FIRE, value: "FIRE" },
];

const getReactionCount = (counts: Record<string, number>, reaction: string) => {
  const displayEmoji = reactionDisplayByCode[reaction];
  return displayEmoji ? counts[displayEmoji] || 0 : 0;
};

const isOwnReaction = (ownReaction: string | null, reaction: string) => ownReaction === reactionDisplayByCode[reaction];

export default function AnnouncementsPage() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/app/announcements", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to load announcements");
      setItems(result.announcements || []);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnnouncements();
  }, []);

  const react = async (announcementId: string, reaction: string) => {
    setSavingId(`${announcementId}:${reaction}`);
    try {
      const response = await fetch("/api/app/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId, emoji: reaction }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save reaction");
      await loadAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save reaction");
    } finally {
      setSavingId(null);
    }
  };

  const reply = async (announcementId: string) => {
    const content = replyDrafts[announcementId]?.trim();
    if (!content) return;
    setSavingId(`${announcementId}:reply`);
    try {
      const response = await fetch("/api/app/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId, content }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to save reply");
      setReplyDrafts((current) => ({ ...current, [announcementId]: "" }));
      await loadAnnouncements();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save reply");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Announcement Board</h1>
        <p className="text-sm text-gray-500">School-wide and batch updates from teachers. React and reply simply.</p>
      </div>

      {loading ? (
        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border border-red-200 bg-red-50 shadow-sm">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="border-0 bg-white shadow-sm">
          <CardContent className="p-8 text-center text-gray-500">
            <Bell className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            No announcements yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="border-0 bg-white shadow-sm">
              <CardHeader className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <Badge className={item.type === "URGENT" ? "w-fit bg-red-100 text-red-700" : "w-fit bg-orange-50 text-orange-700"}>
                    {item.type.toLowerCase()}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{item.content}</p>

                <div className="flex flex-wrap gap-2">
                  {reactions.map((reaction) => (
                    <Button
                      key={reaction.value}
                      variant="outline"
                      size="sm"
                      className={isOwnReaction(item.ownReaction, reaction.value) ? "border-orange-300 bg-orange-50" : ""}
                      disabled={savingId === `${item.id}:${reaction.value}`}
                      onClick={() => react(item.id, reaction.value)}
                    >
                      {reaction.label} {getReactionCount(item.reactionCounts, reaction.value)}
                    </Button>
                  ))}
                </div>

                {item.replies.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    {item.replies.map((replyItem) => (
                      <div key={replyItem.id} className="rounded-lg bg-gray-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-gray-700">
                            {replyItem.mine ? "You" : replyItem.authorName}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(replyItem.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{replyItem.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 border-t pt-4">
                  <input
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-300"
                    value={replyDrafts[item.id] || ""}
                    onChange={(event) => setReplyDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                    placeholder="Write a simple reply"
                    maxLength={500}
                  />
                  <Button
                    className="bg-orange-500 text-white hover:bg-orange-600"
                    disabled={savingId === `${item.id}:reply`}
                    onClick={() => reply(item.id)}
                  >
                    {savingId === `${item.id}:reply` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
