"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type CaptureState = "loading" | "success" | "cancelled" | "error";

export default function PaymentReturnPage() {
  const params = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const [state, setState] = useState<CaptureState>("loading");
  const [message, setMessage] = useState("Confirming your payment.");

  useEffect(() => {
    const provider = searchParams.get("provider");
    const status = searchParams.get("status");
    const orderId = searchParams.get("token");

    if (status === "cancelled") {
      setState("cancelled");
      setMessage("Payment was cancelled before completion.");
      return;
    }

    if (provider !== "paypal" || !orderId) {
      setState("error");
      setMessage("Missing PayPal return details.");
      return;
    }

    let active = true;

    const capture = async () => {
      try {
        const response = await fetch("/api/payments/paypal/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "PayPal capture failed");
        }

        if (!active) return;
        setState("success");
        setMessage("Payment completed and access has been unlocked.");
      } catch (error) {
        if (!active) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "PayPal capture failed");
      }
    };

    void capture();

    return () => {
      active = false;
    };
  }, [searchParams]);

  const locale = params.locale || "en";

  return (
    <main className="min-h-[70vh] bg-gradient-to-br from-stone-50 via-white to-amber-50 px-6 py-20">
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-100 bg-white p-8 text-center shadow-sm">
        {state === "loading" && <Loader2 className="mx-auto mb-6 h-10 w-10 animate-spin text-amber-600" />}
        {state === "success" && <CheckCircle2 className="mx-auto mb-6 h-10 w-10 text-green-600" />}
        {(state === "cancelled" || state === "error") && <XCircle className="mx-auto mb-6 h-10 w-10 text-red-600" />}

        <h1 className="mb-3 font-serif text-3xl text-stone-900">
          {state === "success" ? "Payment Confirmed" : state === "loading" ? "Processing Payment" : "Payment Incomplete"}
        </h1>
        <p className="mb-8 text-sm leading-6 text-stone-600">{message}</p>

        <div className="flex justify-center">
          <Button asChild className="bg-amber-600 hover:bg-amber-700">
            <Link href={`/${locale}`}>{state === "success" ? "Return To Website" : "Back To Home"}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
