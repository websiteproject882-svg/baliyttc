"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell, Mail, Send, Clock, CheckCircle, XCircle, AlertCircle, Users,
  CreditCard, Calendar, MessageSquare, Star, Loader2
} from "lucide-react";

interface CommunicationRecipientItem {
  key: string;
  campaign: string;
  name: string;
  email: string;
  courseName: string;
  batchName: string | null;
  daysUntilStart: number | null;
  daysSinceEnd: number | null;
  accessLevel: string;
  paymentStatus: string;
}

interface CommunicationLogItem {
  id: string;
  campaign: string;
  channel: string;
  recipientEmail: string | null;
  recipientPhone: string | null;
  status: string;
  error: string | null;
  createdAt: string;
}

const campaignConfig = [
  {
    key: "ABANDONED_ENROLLMENT",
    title: "Abandoned Enrollments",
    description: "Students who started enrollment but didn't complete payment",
    icon: AlertCircle,
    color: "text-amber-600 bg-amber-50",
    eligible: "enrollment_started",
    filters: { paymentStatus: ["PENDING"], accessLevel: ["NONE"] },
  },
  {
    key: "PAYMENT_REMINDER",
    title: "Payment Reminders",
    description: "Students with pending balance on upcoming batches",
    icon: CreditCard,
    color: "text-blue-600 bg-blue-50",
    eligible: "payment_pending",
    filters: { paymentStatus: ["DEPOSIT_PAID"], accessLevel: ["NONE", "PRE_ARRIVAL"] },
  },
  {
    key: "PREPARATION_REMINDER",
    title: "Preparation Reminders",
    description: "Active students who should complete pre-arrival tasks",
    icon: Calendar,
    color: "text-purple-600 bg-purple-50",
    eligible: "pre_arrival_pending",
    filters: { accessLevel: ["PRE_ARRIVAL"] },
  },
  {
    key: "VISA_GUIDANCE",
    title: "Visa Guidance",
    description: "Students approaching arrival - visa and entry requirements",
    icon: MessageSquare,
    color: "text-cyan-600 bg-cyan-50",
    eligible: "visa_needed",
    filters: { daysUntilStart: [14, 7, 3] },
  },
  {
    key: "REVIEW_REQUEST",
    title: "Review Requests",
    description: "Recent alumni without approved testimonial",
    icon: Star,
    color: "text-orange-600 bg-orange-50",
    eligible: "alumni_pending_review",
    filters: { accessLevel: ["ALUMNI"] },
  },
] as const;

export default function CommunicationsPage() {
  const [campaignQueues, setCampaignQueues] = useState<Record<string, CommunicationRecipientItem[]>>({});
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningCampaign, setRunningCampaign] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/communications", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load communications");
      }
      setCampaignQueues(data.queues || {});
      setCommunicationLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load communications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const runCampaign = async (campaign: string) => {
    setRunningCampaign(campaign);
    setError(null);
    try {
      const response = await fetch("/api/admin/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign, limit: 25 }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to run campaign");
      }
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run campaign");
    } finally {
      setRunningCampaign(null);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENT":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "SKIPPED":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SENT":
        return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "SKIPPED":
        return <Badge className="bg-amber-100 text-amber-800">Skipped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          <p className="text-sm text-gray-500 mt-1">Send automated campaigns and manage outreach</p>
        </div>
        <Button variant="outline" onClick={() => void fetchData()}>
          <Mail className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaignConfig.map((campaign) => {
          const Icon = campaign.icon;
          const recipients = campaignQueues[campaign.key] || [];
          const isRunning = runningCampaign === campaign.key;

          return (
            <Card key={campaign.key} className="border-0 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`rounded-xl p-2.5 ${campaign.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {recipients.length} eligible
                  </Badge>
                </div>
                <CardTitle className="text-base mt-3">{campaign.title}</CardTitle>
                <CardDescription className="text-sm">{campaign.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant={recipients.length > 0 ? "default" : "outline"}
                  disabled={recipients.length === 0 || isRunning}
                  onClick={() => void runCampaign(campaign.key)}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : recipients.length > 0 ? (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send to {recipients.length}
                    </>
                  ) : (
                    "No recipients"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs for Queue Preview and Log */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList>
          <TabsTrigger value="preview">Recipient Preview</TabsTrigger>
          <TabsTrigger value="log">Communication Log</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-4">
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-500" />
                Campaign Recipients
              </CardTitle>
              <CardDescription>
                Preview who would receive each campaign. Click send to trigger.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaignConfig.map((campaign) => {
                const recipients = campaignQueues[campaign.key] || [];
                if (recipients.length === 0) return null;

                return (
                  <div key={campaign.key} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      {campaign.title}
                      <Badge variant="outline">{recipients.length}</Badge>
                    </h3>
                    <div className="space-y-2">
                      {recipients.slice(0, 5).map((recipient, index) => (
                        <div
                          key={`${recipient.key}-${index}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                              {recipient.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "S"}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{recipient.name}</p>
                              <p className="text-xs text-gray-500">{recipient.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">{recipient.courseName}</p>
                            {recipient.batchName && (
                              <p className="text-xs text-gray-400">{recipient.batchName}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {recipients.length > 5 && (
                        <p className="text-xs text-gray-500 pl-3">
                          +{recipients.length - 5} more recipients
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {Object.keys(campaignQueues).every(key => (campaignQueues[key] || []).length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No campaign recipients at this time.</p>
                  <p className="text-sm">Recipients appear when students match campaign criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="log" className="mt-4">
          <Card className="border-0 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Communication History
              </CardTitle>
              <CardDescription>
                Recent email and WhatsApp messages sent through campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {communicationLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No communications sent yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {communicationLogs.slice(0, 50).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(log.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {log.campaign.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.channel} • {log.recipientEmail || log.recipientPhone || "Unknown recipient"}
                          </p>
                          {log.error && (
                            <p className="text-xs text-red-500 mt-1">{log.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(log.status)}
                        <p className="text-xs text-gray-400 mt-1">{formatDate(log.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
