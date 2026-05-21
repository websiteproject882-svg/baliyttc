import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";

const TOTP_ISSUER = "Bali YTTC";

export function generateTotpSecret(email: string) {
  const secret = generateSecret();
  const otpauthUrl = generateURI({
    issuer: TOTP_ISSUER,
    label: email,
    secret,
    period: 30,
  });
  return { secret, otpauthUrl };
}

export async function generateTotpQrDataUrl(otpauthUrl: string) {
  return QRCode.toDataURL(otpauthUrl, {
    width: 240,
    margin: 1,
  });
}

export function verifyTotpToken(secret: string, token: string) {
  const result = verifySync({
    secret,
    token,
    epochTolerance: 30,
  });
  return result.valid;
}
