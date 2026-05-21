export function getBankTransferInstructions() {
  return {
    accountName: process.env.BANK_TRANSFER_ACCOUNT_NAME || "Bali YTTC",
    bankName: process.env.BANK_TRANSFER_BANK_NAME || "Contact admissions for bank details",
    accountNumber: process.env.BANK_TRANSFER_ACCOUNT_NUMBER || "",
    swiftCode: process.env.BANK_TRANSFER_SWIFT || "",
    iban: process.env.BANK_TRANSFER_IBAN || "",
    note: "Use your enrollment ID as the transfer reference. Access is unlocked after finance confirms receipt.",
  };
}
