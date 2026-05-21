import { toMinorUnits } from "@/lib/payments/pricing";

export async function refundRazorpayPayment(params: {
  paymentId: string;
  amount?: number;
  notes?: Record<string, string>;
}) {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured");
  }

  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch(`https://api.razorpay.com/v1/payments/${params.paymentId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount ? toMinorUnits(params.amount) : undefined,
      notes: params.notes,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Razorpay refund request failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}
