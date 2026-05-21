# PRD v2.0 vs Current Implementation — GAP ANALYSIS

**Date:** May 21, 2026  
**Project:** Bali YTTC Digital Ecosystem  
**PRD Version:** v2.0 Final Discovery  
**Analysis Mode:** Current implementation review

> Status update: this file originally captured the early May gap analysis. The current implementation has since moved to a Next.js App Router app with Prisma, PostgreSQL-ready data model, Firebase/session auth, admin dashboard, student PWA routes, Razorpay/PayPal/bank transfer payment paths, 8 locale message files, and organized docs/assets folders. Historical gap notes below are kept for traceability where useful.

---

## 📊 OVERALL STATUS

| Category | Expected (PRD) | Current | Gap |
|----------|---------------|---------|-----|
| **Pages** | 17 pages | ~8 pages | ❌ 9 pages missing |
| **Languages** | 8 languages | 3 (en, id, zh) | ❌ 5 missing |
| **Products** | 5 products | 1.5 (website only) | ❌ 3.5 missing |
| **Student PWA** | Full featured PWA | Mockup UI only | ❌ 0% complete |
| **Admin Panel** | Full RBAC dashboard | Demo UI only | ❌ 0% complete |
| **Backend** | Express + Prisma + PostgreSQL | None | ❌ 100% missing |
| **Payments** | Stripe + PayPal | None | ❌ 0% complete |
| **Blog CMS** | AI-assisted multilingual CMS | None | ❌ 0% complete |
| **Support Bot** | Rule-based FAQ bot (8 languages) | None | ❌ 0% complete |
| **Auth** | Firebase Auth + JWT | Demo auth only | ❌ Partial |
| **SEO** | Schema markup, sitemap, OG | Minimal | ❌ Partial |

---

## 🔴 CRITICAL GAPS — CLIENT IMPACT (HIGH PRIORITY)

### 1. MISSING PAGES — 9 pages not built

| # | Page | PRD Requirement | Current Status | Impact |
|---|------|-----------------|----------------|--------|
| 1 | **Retreats** | 3-day + 7-day pages (Ubud + Canggu) | ❌ Missing | HIGH — Revenue |
| 2 | **Workshops** | Sound Healing, Acro Yoga, Arm Balancing, Mandala | ❌ Missing | HIGH — Revenue |
| 3 | **50hr Hatha-Vinyasa** | Short course page | ❌ Missing | MEDIUM — Revenue |
| 4 | **Visa Information** | Dedicated page — visa process for European students | ❌ Missing | HIGH — Conversion |
| 5 | **Pricing Page** | Admin-managed seasonal pricing, early bird, deposit info | ❌ Missing | HIGH — Conversion |
| 6 | **Testimonials/Alumni Page** | Full page with Google Reviews embed | ⚠️ Section only | MEDIUM — Trust |
| 7 | **FAQ Page** | Accordion on homepage only | ⚠️ Partial | MEDIUM — Support |
| 8 | **Login/Register** | Firebase Auth login | ⚠️ Basic | MEDIUM — UX |
| 9 | **Student Dashboard** | Full PWA access | ⚠️ Mockup | HIGH — Retention |
| 10 | **Admin Dashboard** | Full control center | ⚠️ Mockup | CRITICAL — Operations |

**Note:** Activities page exists but is likely a stub.

### 2. MULTILINGUAL — 5 Languages Missing

**Current:** EN, ID, ZH only  
**Required (PRD):** EN, ES, DE, KO, ZH, JA, FR, RU

| Language | Code | Status | Impact |
|----------|------|--------|--------|
| English | en | ✅ Done | — |
| Bahasa Indonesia | id | ✅ Done | — |
| Chinese | zh | ✅ Done | — |
| Spanish | es | ❌ Missing | HIGH — EU market |
| German | de | ❌ Missing | HIGH — EU market |
| Korean | ko | ❌ Missing | MEDIUM — Asia |
| Japanese | ja | ❌ Missing | MEDIUM — Asia |
| French | fr | ❌ Missing | MEDIUM — EU market |
| Russian | ru | ❌ Missing | LOW — Small market |

**Note:** Locale message files now live under `src/i18n/messages/`. Remaining work is translation QA and route/content review, not file creation.

### 3. PAYMENT & ENROLLMENT FLOW — Completely Missing

**PRD Requirement:**
- Course → Batch → Accommodation → Coupon → Deposit/Full → Stripe/PayPal → Confirmation
- Abandoned enrollment recovery (auto emails at 1hr, 24hr, 3 days)
- Failed payment → email with retry link
- Currency auto-detect (EUR/USD)
- Seasonal pricing, early bird automation

**Current:** Only a 3-step form that sends email. No real payment flow.

### 4. ACCOMMODATION SELECTOR — Hardcoded

**PRD:** Admin-configurable room types + prices per course, mandatory/optional per batch  
**Current:** Hardcoded 3 tiers in CoursePage.tsx — `Shared Villa`, `Private Villa`, `Luxury Villa`

### 5. BATCH MANAGEMENT — Hardcoded

**PRD:** Admin creates annual batches, one-click clone to next year, seat count, waitlist  
**Current:** Static data in `site.ts` — `BATCHES` array

### 6. LIVE SEAT COUNTER — Static

**PRD:** Live seat count on every course page, auto-close when full  
**Current:** `seats: "6 seats left"` hardcoded in site.ts

---

## 🟡 KEY CONVERSION GAPS — REVENUE IMPACT

### 7. INTERACTIVE SYLLABUS — Not Day-by-Day

**PRD:** Day-by-day clickable syllabus on each course page  
**Current:** Module accordion — NOT day-by-day

### 8. COUNTDOWN TIMER — Hardcoded Date

**Current:** `const targetDate = new Date("2026-03-02T00:00:00").getTime()` — hardcoded  
**PRD:** Live countdown to next batch from admin-configured batch date

### 9. SEASONAL & EARLY BIRD PRICING — Not Dynamic

**PRD:** Admin sets different prices per season, early bird with deadline, auto-switches  
**Current:** `priceFrom: 999` static in site.ts

### 10. COUPON/DISCOUNT SYSTEM — Not Built

**PRD:** % or fixed coupons, usage limit, expiry date, alumni discount toggle  
**Current:** Not implemented

### 11. LEAD MAGNET — Not Built

**PRD:** Free PDF guide download → email capture → Brevo newsletter sequence  
**Current:** Not implemented

### 12. EARLY BIRD EMAIL — Not Built

**PRD:** Auto-announce new batches to newsletter subscribers  
**Current:** Not implemented

### 13. WHATSAPP CHAT BUTTON — Exists but Limited

**PRD:** Opens owner WhatsApp directly  
**Current:** ✅ Exists but needs WhatsApp number verification

### 14. ABANDONED ENROLLMENT RECOVERY — Not Built

**PRD:** Auto email at 1hr, 24hr, 3 days after incomplete payment  
**Current:** Not implemented

---

## 🟠 STUDENT PWA — 0% Real Implementation

### What's Built: Mockup UI only (no real features)

| Feature | PRD Status | Current Status |
|---------|-----------|----------------|
| Dashboard | ✅ Required | ⚠️ Mockup with fake data |
| Pre-Arrival Portal | ✅ Required | ❌ Not built |
| Video Lessons (YouTube embed) | ✅ Required | ❌ Not built |
| Class Schedule (weekly/daily) | ✅ Required | ❌ Not built |
| Progress Tracker | ✅ Required | ⚠️ Progress bar only |
| Announcement Board | ✅ Required | ❌ Not built |
| Personal Notes (private notepad) | ✅ Required | ❌ Not built |
| Profile + Photo Upload | ✅ Required | ❌ Not built |
| Certificate Download (PDF) | ✅ Required | ❌ Not built |
| Review Section (Google/TripAdvisor) | ✅ Required | ❌ Not built |
| Testimonial Submit | ✅ Required | ❌ Not built |
| Notifications (email + push) | ✅ Required | ❌ Not built |
| Alumni Feed | ✅ Required | ❌ Not built |
| Visa Info Section | ✅ Required | ❌ Not built |

### Student Access Rules — Not Enforced

**PRD:**
- Only paid students access PWA
- Email lock (login email must match payment email)
- Pre-arrival access after deposit
- Full access after full payment
- Alumni access post-course

**Current:** Anyone can access `/app/dashboard` — no auth enforcement

---

## 🔴 ADMIN PANEL — 0% Real Implementation

### Mockup UI exists but no real features:

| Module | PRD Requirement | Current |
|--------|----------------|---------|
| Student Management | View all, approve/reject, revoke access, send email | ❌ |
| Course & Batch Management | CRUD courses, batches, clone, accommodation | ❌ |
| Accommodation Settings | Room types, prices per course | ❌ |
| Ceremony Calendar | Mark Balinese ceremony dates | ❌ |
| Pre-Arrival Content | Upload videos, PDFs, travel guide | ❌ |
| Payments | Stripe/PayPal transactions, refunds, invoices | ❌ |
| Coupons & Discounts | Create, expiry, usage limits | ❌ |
| Abandoned Enrollment | Toggle + auto emails | ❌ |
| Email Templates | Text editor for all 7 templates | ❌ |
| Blog CMS | Rich editor, AI assist, SEO fields, multilingual | ❌ |
| Gallery | Upload, approve student photos | ❌ |
| Testimonials | Approve submissions, Google Reviews | ❌ |
| Teacher Profiles | Add/edit/delete profiles | ❌ |
| Instructor Accounts | Invite teachers via email | ❌ |
| Support Bot | FAQ knowledge base, conversation logs | ❌ |
| Analytics Dashboard | Enrollments, revenue, per-course breakdown | ⚠️ Stats only |
| Social Proof Numbers | Manually update graduates, rating | ❌ |
| Notification Management | Push/email to students | ❌ |
| Staff Management (RBAC) | Invite, roles, audit log | ❌ |

### RBAC Roles — Not Implemented

**PRD:** 6 roles — Super Admin, Student Manager, SEO Editor, Finance Manager, Course Manager, Teacher  
**Current:** All demo data, `forceAdmin = true`

### TOTP 2FA — Not Built

**PRD:** Admin login requires Google Authenticator 6-digit OTP  
**Current:** Not implemented

### Audit Log — Not Built

**PRD:** Every admin action logged — who, what, when, old value, new value  
**Current:** Not implemented

---

## 🟠 SUPPORT BOT — 0% Implementation

**PRD:**
- Bottom-right chat bubble, no auto-popup
- Rule-based FAQ — no AI API cost
- 8 languages, auto-switches with site language
- Knowledge base: courses, pricing, batch dates, accommodation, FAQs, visa, location, contact, payment info
- Escalation to contact form
- Admin updates FAQ from panel
- Conversation logs
- Toggle on/off

**Current:** WhatsApp chat button exists — that's it.

---

## 🟠 BLOG CMS — 0% Implementation

**PRD:**
- Rich text editor (bold, italic, H1-H4, lists, images, embeds, blockquotes, tables)
- AI Writing Assistant (improve paragraph, SEO suggestions, readability score)
- SEO Fields (meta title, description, slug, focus keyword, OG preview, Twitter Card)
- Auto Article schema
- Auto sitemap on publish
- Categories + Tags
- Schedule publish (set date/time)
- Featured image upload + auto-compress
- Draft + Preview + one-click publish
- Multilingual (8 languages)

**Current:** Blog page exists as stub with static data.

---

## 🟠 BACKEND — 100% Missing

### Not Built:

| Component | PRD Requirement | Status |
|-----------|----------------|--------|
| Express.js API | REST API framework | ❌ |
| Prisma ORM | Type-safe DB queries | ❌ |
| PostgreSQL | Database | ❌ |
| Redis | Caching, sessions, rate limiting | ❌ |
| Firebase Auth | User authentication | ⚠️ Client-side demo only |
| Custom JWT | httpOnly cookie, 8hr session | ⚠️ session.ts exists but not integrated |
| Row Level Security | DB-level student data isolation | ❌ |
| Zod Validation | Every API endpoint | ❌ |
| Stripe Integration | Card payments EUR/USD | ❌ |
| PayPal Integration | PayPal wallet | ❌ |
| Multer | File uploads (photos, gallery, PDFs) | ❌ |
| PDFKit | Certificate generation | ❌ |
| node-cron | Reminders, batch alerts | ❌ |
| Brevo | Newsletter emails | ❌ |
| Resend | Transactional emails (OTP, confirm) | ❌ |
| express-rate-limit + Redis | Rate limiting | ❌ |
| CORS | Only baliyttc.com allowed | ❌ |

### API Routes That Should Exist But Don't:

```
POST /api/auth/login         → Basic login exists
POST /api/auth/logout        → Basic logout exists
POST /api/enrollments        → Not built
GET  /api/enrollments        → Not built
PUT  /api/enrollments/:id    → Not built
POST /api/payments/create    → Not built
POST /api/payments/webhook   → Not built (Stripe/PayPal)
GET  /api/batches            → Not built
GET  /api/batches/:id        → Not built
POST /api/batches            → Not built
GET  /api/students           → Not built
GET  /api/students/:id       → Not built
POST /api/coupons/validate   → Not built
GET  /api/analytics          → Not built
POST /api/upload             → Not built
GET  /api/certificates/:id  → Not built
```

---

## 🟠 SEO GAPS

### Schema Markup — Missing

**PRD Required:**
- Organization schema
- Course schema
- Article schema (blog)
- Batch availability schema (shows "Next batch: March 15 — 3 seats left" in Google)

**Current:** Minimal or none

### Sitemap — Needs Auto-Update

**PRD:** sitemap.xml auto-updates on every publish (blog, pages)  
**Current:** Static sitemap.xml exists

### Open Graph + Twitter Cards — Partial

**Current:** Basic OG tags likely in layout.tsx

### Multilingual SEO — Not Implemented

**PRD:** hreflang tags, language-specific meta tags  
**Current:** Not implemented

---

## 🟠 PWA FEATURES — Missing

| Feature | PRD | Current |
|---------|-----|---------|
| Service Worker | Full PWA installable | ⚠️ sw.js exists |
| Web Push API | Browser push notifications | ❌ |
| Offline support | Cached content | ❌ |
| App manifest | Install on home screen | ⚠️ manifest.json exists |

---

## 🟠 SECURITY GAPS

| Feature | PRD | Current |
|---------|-----|---------|
| Admin 2FA (TOTP) | Required | ❌ |
| JWT httpOnly cookie | XSS protected | ⚠️ session.ts exists but not used |
| Rate Limiting | Redis + express-rate-limit | ❌ |
| CORS | baliyttc.com only | ❌ |
| Input Validation (Zod) | Every endpoint | ❌ |
| Row Level Security | PostgreSQL RLS | ❌ |
| Audit Log | Every admin action | ❌ |
| DDOS Protection | Cloudflare WAF | ⚠️ Cloudflare config needed |

---

## ✅ WHAT'S WORKING WELL

1. **Homepage Sections** — All 14 sections built and looking great
2. **Design System** — Tailwind + custom CSS variables, consistent theming
3. **Course Pages** — Good structure with hero, highlights, curriculum, accommodation, FAQ
4. **Navigation** — Mega menu with all categories
5. **ApplyModal** — 3-step form with validation, psychology elements
6. **Language Switcher** — Infrastructure in place for 3 languages
7. **WhatsApp Chat** — Floating button working
8. **Teacher/Instructor Data** — Real teacher profiles
9. **Testimonials** — Real student quotes
10. **Mobile Responsive** — Tailwind mobile-first approach
11. **Animations** — Framer Motion throughout
12. **SEO Basics** — Meta tags, sitemap
13. **Firebase Setup** — Configured for demo mode
14. **Auth Infrastructure** — Context, session helpers ready

---

## 🎯 PRIORITY RECOMMENDATION

### **Tier 1 — MUST HAVE (Client Impact, Launch Critical):**
1. Missing Pages: Retreats, Workshops, Visa Info, Pricing
2. Payment Flow: Stripe + PayPal integration
3. Batch + Accommodation management (admin)
4. Email system: Resend transactional
5. Student PWA access control (email lock, deposit/full access)
6. Multilingual: ES, DE (top EU markets)

### **Tier 2 — SHOULD HAVE (Conversion Impact):**
1. Interactive day-by-day syllabus
2. Live countdown + seat counter from DB
3. Seasonal + early bird pricing
4. Coupon system
5. WhatsApp button (real number)
6. Lead magnet (PDF guide)
7. FAQ page + Support bot (basic)

### **Tier 3 — CAN LAUNCH WITHOUT (MVP):**
1. Blog CMS (can add later)
2. AI writing assistant
3. Push notifications
4. Alumni features
5. Certificate PDF generation
6. All 8 languages (start with EN, ES, DE)

---

## 📋 WORK ESTIMATE (Simplified)

| Phase | Work Items | Complexity |
|-------|-----------|------------|
| **Phase A** | Missing pages (Retreats, Workshops, Visa, Pricing) | Medium |
| **Phase B** | Multilingual (ES, DE, ZH expanded) | Medium |
| **Phase C** | Payment Flow (Stripe/PayPal + enrollment) | HIGH |
| **Phase D** | Admin Panel real backend (batches, students, payments) | HIGH |
| **Phase E** | Student PWA real features | HIGH |
| **Phase F** | Support Bot + FAQ page | Medium |
| **Phase G** | Blog CMS | Medium |
| **Phase H** | SEO + Schema markup | Low-Medium |
| **Phase I** | Security hardening (2FA, Rate limit, Audit log) | Medium |

**Total Phases: 9**  
**Estimated Duration: 6-8 weeks** (depending on team size and priorities)

---

*This analysis is based on PRD v2.0 Final Discovery (May 2026) and current codebase review.*
