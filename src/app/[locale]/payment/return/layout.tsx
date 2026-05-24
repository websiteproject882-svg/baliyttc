import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Return | Bali YTTC",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentReturnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
