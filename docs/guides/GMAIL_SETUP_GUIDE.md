# Gmail Setup Guide for Bali YTTC

Current status (May 22, 2026): Gmail SMTP is the active transactional email option for staging/testing. The app also supports Resend, but Resend is optional until the client wants a dedicated transactional email provider with domain verification.

## Prerequisites
- Client's Gmail account (with 2-Factor Authentication enabled)
- Access to Google Account settings

---

## Step 1: Enable 2-Factor Authentication

1. Go to: https://myaccount.google.com/security
2. Sign in with the Gmail account
3. Click on **"2-Step Verification"** (under "How you sign in to Google")
4. Follow the steps to enable 2FA
5. **Recommended:** Set up backup codes for recovery

---

## Step 2: Create App Password

App Password is a 16-character code that allows third-party apps (like our email system) to access Gmail.

1. Go to: https://myaccount.google.com/apppasswords
2. If you don't see "App passwords", make sure 2FA is enabled first
3. Select app: **"Mail"**
4. Select device: **"Other (Custom name)"** → Enter: `Bali YTTC Email System`
5. Click **Generate**
6. **Copy the 16-character password** (format: `xxxx xxxx xxxx xxxx`)

⚠️ **Important:** This password only shows ONCE. Save it securely!

---

## Step 3: Update .env File

Add these variables to your `.env` file:

```env
# Gmail SMTP
GMAIL_EMAIL="baliyttc@gmail.com"
GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"  # Your 16-char app password
ADMIN_EMAIL="info@baliyttc.com"
```

---

## Step 4: Test Email Sending

After setting up, test by:
1. Submitting a contact form on the website
2. Checking if enrollment confirmation email works

---

## Gmail Limits

| Limit | Value |
|-------|-------|
| Daily emails | 500 |
| Per message | 500 recipients |
| Per hour | ~60-100 |

For higher volume, consider Resend API.

---

## Troubleshooting

### "Username and Password not accepted"
- Check if 2FA is enabled
- Verify App Password is correct (no spaces)
- Make sure you're using the App Password, not your regular password

### "Please log in via your web browser"
- This happens when Gmail blocks the login
- Solution: Allow less secure apps OR use App Password (recommended)

### "Sign-in attempt blocked"
- Go to: https://myaccount.google.com/security
- Look for "Less secure app access" or "App passwords"
- Create a new App Password

---

## Alternative: Use Resend

If you expect higher volume, better deliverability reporting, or domain-based sending, use Resend:

1. Sign up at: https://resend.com
2. Add a domain (baliyttc.com)
3. Verify DNS records
4. Get API key
5. Update .env:
```env
RESEND_API_KEY="re_xxxxxxxxxxxxx"
```

---

## Contact Form Setup (EmailJS)

For the contact form to work:

1. Sign up at: https://emailjs.com
2. Create a service (connect your Gmail)
3. Create email templates
4. Get your:
   - Public Key
   - Service ID
   - Template IDs

Update .env:
```env
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY="xxxxxxxx"
NEXT_PUBLIC_EMAILJS_SERVICE_ID="service_xxx"
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID="template_xxx"
NEXT_PUBLIC_EMAILJS_ADMIN_TEMPLATE_ID="template_xxx"
```
