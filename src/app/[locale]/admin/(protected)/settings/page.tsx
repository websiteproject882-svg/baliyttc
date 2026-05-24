"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle, CreditCard, FileText, Globe, Loader2, Save, Settings, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SiteSettings = {
  general: {
    schoolName: string;
    tagline: string;
    email: string;
    phone: string;
    address: string;
    timezone: string;
  };
  payments: {
    paypalEnabled: boolean;
    razorpayEnabled: boolean;
    bankTransferEnabled: boolean;
    depositEnabled: boolean;
    fullPaymentEnabled: boolean;
    displayCurrencyPrimary: "EUR" | "USD";
    displayCurrencySecondary: "EUR" | "USD" | "INR";
    razorpayCurrency: "INR";
    eurToInrRate: number;
    usdToInrRate: number;
    providerOrder: Array<"paypal" | "razorpay" | "bank_transfer">;
  };
  notifications: {
    emailOnEnrollment: boolean;
    emailOnPayment: boolean;
    emailOnLead: boolean;
    whatsappOnEnrollment: boolean;
    whatsappOnPayment: boolean;
  };
  reviews: {
    googleReviewUrl: string;
    tripadvisorReviewUrl: string;
  };
  assets: {
    logoUrl: string;
    courseManualUrl: string;
    certificateTemplateUrl: string;
    mapsEmbedUrl: string;
    mapsLinkUrl: string;
  };
};

type Providers = {
  paypal: { envReady: boolean; requiredEnv: string[] };
  razorpay: { envReady: boolean; requiredEnv: string[] };
  bankTransfer: { envReady: boolean; requiredEnv: string[] };
};

const providerLabels: Record<string, string> = {
  paypal: "PayPal",
  razorpay: "Razorpay",
  bank_transfer: "Bank Transfer",
};

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? "bg-blue-600" : "bg-gray-300"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
          checked ? "left-5" : "left-0.5"
        }`}
      />
    </button>
  );
}

function EnvBadge({ ready }: { ready: boolean }) {
  return ready ? (
    <Badge className="bg-green-100 text-green-700">Env ready</Badge>
  ) : (
    <Badge className="bg-amber-100 text-amber-700">Keys pending</Badge>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [providers, setProviders] = useState<Providers | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/settings", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(response.status === 401 || response.status === 403 ? "Super admin access required." : "Failed to load settings.");
        }
        const data = await response.json();
        if (mounted) {
          setSettings(data.settings);
          setProviders(data.providers);
          setError(null);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load settings.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const update = <Section extends keyof SiteSettings>(
    section: Section,
    values: Partial<SiteSettings[Section]>,
  ) => {
    setSettings((current) => {
      if (!current) return current;
      return {
        ...current,
        [section]: {
          ...current[section],
          ...values,
        },
      };
    });
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to save settings.");
      }

      const data = await response.json();
      setSettings(data.settings);
      setProviders(data.providers);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-3 p-6 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            {error || "Settings could not be loaded."}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-500">Configure school, payments, content links, and notifications.</p>
          </div>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
          </Button>
        </div>
        {error ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        ) : null}
      </div>

      <div className="p-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="border bg-white">
            <TabsTrigger value="general"><Settings className="mr-2 h-4 w-4" />General</TabsTrigger>
            <TabsTrigger value="payments"><CreditCard className="mr-2 h-4 w-4" />Payments</TabsTrigger>
            <TabsTrigger value="content"><FileText className="mr-2 h-4 w-4" />Content</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
            <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" />Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Primary school details used across website emails and student portal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="School Name" value={settings.general.schoolName} onChange={(value) => update("general", { schoolName: value })} />
                  <Field label="Tagline" value={settings.general.tagline} onChange={(value) => update("general", { tagline: value })} />
                  <Field label="Contact Email" type="email" value={settings.general.email} onChange={(value) => update("general", { email: value })} />
                  <Field label="Phone Number" value={settings.general.phone} onChange={(value) => update("general", { phone: value })} />
                </div>

                <Field label="Address" value={settings.general.address} onChange={(value) => update("general", { address: value })} />

                <Separator />

                <div className="grid gap-6 md:grid-cols-3">
                  <SelectField
                    label="Timezone"
                    value={settings.general.timezone}
                    onChange={(value) => update("general", { timezone: value })}
                    options={[
                      ["Asia/Makassar", "Asia/Makassar (Bali WITA)"],
                      ["Asia/Jakarta", "Asia/Jakarta (WIB)"],
                      ["UTC", "UTC"],
                    ]}
                  />
                  <SelectField
                    label="Primary Display Currency"
                    value={settings.payments.displayCurrencyPrimary}
                    onChange={(value) => update("payments", { displayCurrencyPrimary: value as "EUR" | "USD" })}
                    options={[
                      ["EUR", "EUR"],
                      ["USD", "USD"],
                    ]}
                  />
                  <SelectField
                    label="Secondary Display Currency"
                    value={settings.payments.displayCurrencySecondary}
                    onChange={(value) => update("payments", { displayCurrencySecondary: value as "EUR" | "USD" | "INR" })}
                    options={[
                      ["USD", "USD"],
                      ["EUR", "EUR"],
                      ["INR", "INR"],
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Payment Provider Toggles</CardTitle>
                  <CardDescription>Final order is PayPal first, Razorpay second, Bank Transfer third. Keys stay in environment variables.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ProviderRow
                    title="PayPal"
                    description="Recommended first option for European and international students."
                    enabled={settings.payments.paypalEnabled}
                    envReady={providers?.paypal.envReady ?? false}
                    onChange={(paypalEnabled) => update("payments", { paypalEnabled })}
                  />
                  <ProviderRow
                    title="Razorpay"
                    description="Indian account checkout. INR conversion is shown before payment."
                    enabled={settings.payments.razorpayEnabled}
                    envReady={providers?.razorpay.envReady ?? false}
                    onChange={(razorpayEnabled) => update("payments", { razorpayEnabled })}
                  />
                  <ProviderRow
                    title="Bank Transfer"
                    description="Manual payment option for students who need invoice or direct transfer."
                    enabled={settings.payments.bankTransferEnabled}
                    envReady
                    onChange={(bankTransferEnabled) => update("payments", { bankTransferEnabled })}
                  />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>Checkout Rules</CardTitle>
                  <CardDescription>Controls what students can choose during enrollment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <ToggleRow
                    title="Deposit Payment"
                    description="Allow students to pay deposit and unlock pre-arrival portal."
                    checked={settings.payments.depositEnabled}
                    onChange={(depositEnabled) => update("payments", { depositEnabled })}
                  />
                  <ToggleRow
                    title="Full Payment"
                    description="Allow full course payment and automatic full portal access."
                    checked={settings.payments.fullPaymentEnabled}
                    onChange={(fullPaymentEnabled) => update("payments", { fullPaymentEnabled })}
                  />
                  <div className="grid gap-6 md:grid-cols-2">
                    <NumberField
                      label="EUR to INR rate for Razorpay estimate"
                      value={settings.payments.eurToInrRate}
                      onChange={(eurToInrRate) => update("payments", { eurToInrRate })}
                    />
                    <NumberField
                      label="USD to INR rate for Razorpay estimate"
                      value={settings.payments.usdToInrRate}
                      onChange={(usdToInrRate) => update("payments", { usdToInrRate })}
                    />
                  </div>
                  <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
                    Checkout display order: {settings.payments.providerOrder.map((provider) => providerLabels[provider]).join(" -> ")}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Content Links</CardTitle>
                <CardDescription>Keep production assets configurable without a code deploy.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Logo URL" value={settings.assets.logoUrl} onChange={(logoUrl) => update("assets", { logoUrl })} placeholder="https://..." />
                  <Field label="Course Manual PDF URL" value={settings.assets.courseManualUrl} onChange={(courseManualUrl) => update("assets", { courseManualUrl })} placeholder="https://..." />
                  <Field label="Certificate Template URL" value={settings.assets.certificateTemplateUrl} onChange={(certificateTemplateUrl) => update("assets", { certificateTemplateUrl })} placeholder="https://..." />
                  <Field label="Google Maps Embed URL" value={settings.assets.mapsEmbedUrl} onChange={(mapsEmbedUrl) => update("assets", { mapsEmbedUrl })} placeholder="https://www.google.com/maps?..." />
                  <Field label="Google Maps Directions URL" value={settings.assets.mapsLinkUrl} onChange={(mapsLinkUrl) => update("assets", { mapsLinkUrl })} placeholder="https://maps.app.goo.gl/..." />
                  <Field label="Google Review URL" value={settings.reviews.googleReviewUrl} onChange={(googleReviewUrl) => update("reviews", { googleReviewUrl })} placeholder="https://..." />
                  <Field label="TripAdvisor Review URL" value={settings.reviews.tripadvisorReviewUrl} onChange={(tripadvisorReviewUrl) => update("reviews", { tripadvisorReviewUrl })} placeholder="https://..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Choose operational alerts for enrollment, payment, and leads.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ToggleRow title="Email on New Enrollment" description="Notify admin when a student enrolls." checked={settings.notifications.emailOnEnrollment} onChange={(emailOnEnrollment) => update("notifications", { emailOnEnrollment })} />
                <ToggleRow title="Email on Payment" description="Notify admin when payment status changes." checked={settings.notifications.emailOnPayment} onChange={(emailOnPayment) => update("notifications", { emailOnPayment })} />
                <ToggleRow title="Email on New Lead" description="Notify admin when a lead submits an inquiry." checked={settings.notifications.emailOnLead} onChange={(emailOnLead) => update("notifications", { emailOnLead })} />
                <ToggleRow title="WhatsApp on Enrollment" description="Optional operational WhatsApp alert." checked={settings.notifications.whatsappOnEnrollment} onChange={(whatsappOnEnrollment) => update("notifications", { whatsappOnEnrollment })} />
                <ToggleRow title="WhatsApp on Payment" description="Optional payment WhatsApp alert." checked={settings.notifications.whatsappOnPayment} onChange={(whatsappOnPayment) => update("notifications", { whatsappOnPayment })} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>Security Status</CardTitle>
                <CardDescription>Runtime security controls currently active in the platform.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <StatusCard title="httpOnly Sessions" description="Student, admin, and staff tokens are stored in httpOnly cookies." />
                <StatusCard title="Admin Settings Lock" description="Only Super Admin can edit global settings." />
                <StatusCard title="Audit Logging" description="Settings changes are written to the admin audit log." />
                <StatusCard title="Provider Secrets" description="Payment secrets stay in Vercel/VPS env vars, not in the browser or database." />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      <Input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      <Input type="number" min="1" value={value} onChange={(event) => onChange(Number(event.target.value || 0))} />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      <select className="w-full rounded-lg border px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>{labelText}</option>
        ))}
      </select>
    </label>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
      <div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function ProviderRow({
  title,
  description,
  enabled,
  envReady,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  envReady: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{title}</h3>
              <EnvBadge ready={envReady} />
            </div>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        <Toggle checked={enabled} onChange={onChange} />
      </div>
      {!envReady && title !== "Bank Transfer" ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          Toggle can be saved now. Checkout becomes active only after client keys are added to env.
        </div>
      ) : null}
    </div>
  );
}

function StatusCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="mb-2 flex items-center gap-2 text-green-700">
        <CheckCircle className="h-4 w-4" />
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
