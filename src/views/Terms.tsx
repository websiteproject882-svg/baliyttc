"use client";
import { Reveal } from "@/components/shared/Reveal";
import { Link } from "@/i18n/routing";

const Terms = () => {
  return (
    <div className="pt-32 pb-24 bg-[#FAFAFA] min-h-screen">
      <div className="container-edit max-w-4xl mx-auto">
        <Reveal>
          <Link href="/" className="text-gray-500 hover:text-[#F04E23] text-xs font-bold tracking-widest uppercase mb-8 inline-block transition-colors">
            ← Back to Home
          </Link>
        </Reveal>

        <Reveal delay={0.1}>
          <h1 className="display-lg mb-8 text-gray-900">
            Terms & <span className="text-[#F04E23]">Policy</span>
          </h1>
          <p className="text-gray-500 text-sm mb-12">Last updated: May 5, 2026</p>

          <div className="prose prose-gray max-w-none bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
            <h2 className="display-sm mb-4 mt-0 text-gray-900">1. Booking and Payment</h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              A deposit is required to secure your spot in any Yoga Teacher Training program. The remaining balance must be paid 30 days prior to the course start date. If booking within 30 days of the start date, full payment is required. All payments are processed securely in USD.
            </p>

            <h2 className="display-sm mb-4 text-gray-900">2. Cancellation Policy</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We understand that unforeseen circumstances may arise. Our cancellation policy is designed to be fair to both our students and our faculty:
            </p>
            <ul className="list-disc pl-5 text-gray-600 leading-relaxed mb-8 space-y-2">
              <li>Cancellations made 60+ days before the start date: Full refund minus a $100 admin fee.</li>
              <li>Cancellations made 30-59 days before the start date: Deposit is non-refundable, but can be transferred to a future course.</li>
              <li>Cancellations made within 30 days: No refunds, but the balance (excluding deposit) can be transferred to a future course within 12 months.</li>
            </ul>

            <h2 className="display-sm mb-4 text-gray-900">3. Attendance and Certification</h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              To receive a Yoga Alliance certificate, 100% attendance is required. If a student misses classes due to illness, makeup sessions must be arranged with lead teachers. The faculty reserves the right to withhold certification if the student does not meet the necessary standards or fails to complete required hours.
            </p>

            <h2 className="display-sm mb-4 text-gray-900">4. Code of Conduct</h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              Bali YTTC is a space of mutual respect, learning, and spiritual growth. We do not tolerate any form of harassment, discrimination, or disruptive behavior. We ask all students to observe silence during designated hours (such as morning meditation) and respect the local Balinese culture and customs.
            </p>

            <h2 className="display-sm mb-4 text-gray-900">5. Health and Liability</h2>
            <p className="text-gray-600 leading-relaxed mb-0">
              Yoga involves physical exertion. It is the student's responsibility to consult a physician prior to participation. Bali YTTC is not liable for any injuries sustained during the course. Students are highly encouraged to purchase comprehensive travel and health insurance prior to arriving in Bali.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
};

export default Terms;
