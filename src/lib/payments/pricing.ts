export interface PriceCalculation {
  basePrice: number;
  accommodationUpgrade: number;
  couponDiscount: number;
  finalPrice: number;
  depositAmount: number;
  remainingAmount: number;
}

export function calculatePrice(params: {
  coursePrice: number;
  accommodationPrice?: number;
  couponDiscount?: number;
}): PriceCalculation {
  const { coursePrice, accommodationPrice = 0, couponDiscount = 0 } = params;
  const totalBeforeDiscount = coursePrice + accommodationPrice;
  const discountAmount = Math.round(totalBeforeDiscount * (couponDiscount / 100));
  const finalPrice = Math.max(0, totalBeforeDiscount - discountAmount);
  const depositAmount = finalPrice > 0 ? Math.min(finalPrice, Math.max(200, Math.round(finalPrice * 0.2))) : 0;
  const remainingAmount = finalPrice - depositAmount;

  return {
    basePrice: coursePrice,
    accommodationUpgrade: accommodationPrice,
    couponDiscount: discountAmount,
    finalPrice,
    depositAmount,
    remainingAmount,
  };
}

export const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "EUR ",
  GBP: "GBP ",
  INR: "Rs. ",
};

export function formatCurrency(amount: number, currency = "USD"): string {
  const symbol = currencySymbols[currency.toUpperCase()] || `${currency.toUpperCase()} `;
  return symbol + amount.toLocaleString();
}

export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}
