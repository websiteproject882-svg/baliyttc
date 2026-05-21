# CI/CD Pipeline Setup Guide

## 🚀 Overview
This project includes automated CI/CD pipelines for:
- **GitHub Actions**: Lint, type check, build, and test on every push/PR
- **Vercel**: Auto-deploy to production on `main` branch, preview on PRs

## 📋 GitHub Actions Setup

### ✅ What's Included
- **CI Pipeline** (`.github/workflows/ci.yml`):
  - Runs ESLint (code quality)
  - TypeScript type checking
  - Production build verification
  - Automated tests (Vitest)
  - Triggers on push/PR to `main` and `develop` branches

### 🔧 No Secrets Required
GitHub Actions CI runs automatically without configuration! The pipeline uses demo Firebase credentials for build-time checks.

### 📊 Status Badges
Once deployed, add these to your README:
```markdown
![CI](https://github.com/websiteproject882-svg/baliyttc/actions/workflows/ci.yml/badge.svg)
![Vercel](https://vercel.com/badge)
```

---

## 🌐 Vercel Deployment Setup

### ✅ What's Included
- **Vercel Pipeline** (`.github/workflows/vercel.yml`):
  - Auto-deploy to production on `main` branch push
  - Auto-deploy preview on pull requests
  - Automatic roll-back capability

### 🔑 Required Secrets (GitHub)
1. Go to **Settings** → **Secrets and Variables** → **Actions**
2. Add these secrets:

| Secret Name | Where to Find |
|------------|---------------|
| `VERCEL_TOKEN` | [Vercel Account Settings → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | [Vercel Team Settings → General](https://vercel.com/teams) (if using team) or leave as personal |
| `VERCEL_PROJECT_ID` | [Vercel Project Settings → General](https://vercel.com/projects) |

**How to Get Values:**
1. **VERCEL_TOKEN**: Create a new token in Vercel → Account Settings → Tokens
   - Select "Full Account" scope
   - Copy the token immediately

2. **VERCEL_ORG_ID**: In Vercel dashboard, it's in the URL: `vercel.com/teams/{VERCEL_ORG_ID}` or use your username for personal account

3. **VERCEL_PROJECT_ID**: Create a new project in Vercel or link existing one
   - Go to Project Settings → General
   - Copy the Project ID

### 📝 Environment Variables (Vercel)
Set these in **Vercel Project Settings** → **Environment Variables**:

**Production & Preview:**
```
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
DATABASE_URL=postgresql://...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
[Add all other NEXT_PUBLIC_* vars]
```

**Production Only:**
```
SESSION_SECRET=...
CRON_SECRET=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
[Add other sensitive vars]
```

---

## 🔒 Branch Protection Rules (Optional but Recommended)

Go to **Settings** → **Branches** → **Add Rule** and configure for `main`:

```
✓ Require a pull request before merging
✓ Require status checks to pass before merging
  - Required status checks:
    - Lint & Type Check
    - Build
    - Tests
    - Vercel (Production)
✓ Require branches to be up to date before merging
✓ Require code reviews before merging (recommended: 1)
```

---

## 🚀 First Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Add CI/CD pipelines"
git push origin main
```

### 2. Watch GitHub Actions
- Go to **Actions** tab
- Watch the CI pipeline run
- Should pass all checks (lint, typecheck, build, test)

### 3. Create Vercel Project
- Go to [Vercel Dashboard](https://vercel.com)
- Click **Add New** → **Project**
- Select your GitHub repository
- Framework: **Next.js**
- Build Command: `npm run build`
- Install Command: `npm ci`
- Output Directory: `.next`

### 4. Add GitHub Secrets
- After Vercel project created, get:
  - VERCEL_TOKEN (from Vercel account settings)
  - VERCEL_ORG_ID (from Vercel team/personal account)
  - VERCEL_PROJECT_ID (from Vercel project settings)
- Add to GitHub repo secrets

### 5. Set Environment Variables
- In Vercel Project Settings → Environment Variables
- Add all required variables from `.env.example`

### 6. Test the Pipeline
- Create a new branch
- Make a small change (e.g., update README)
- Create a PR
- Watch GitHub Actions run CI
- Watch Vercel create a preview deployment
- Merge PR to trigger production deployment

---

## 📊 Monitoring Deployments

### GitHub Actions
- **Dashboard**: Settings → Actions → All Workflows
- **Per Commit**: View workflow status next to commit in history
- **Per PR**: See CI status checks before merge button

### Vercel
- **Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Per Deployment**: Click deployment card for logs
- **Automatic Rollbacks**: Enabled by default on production

---

## 🐛 Troubleshooting

### Build Fails in Vercel but Works Locally
- Check environment variables are set in Vercel
- Ensure DATABASE_URL is accessible from Vercel
- Check for missing NEXT_PUBLIC_* variables

### CI Pipeline Fails but Works Locally
- Run locally: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test`
- Check Node version matches (should be 20.x)
- Ensure `.gitignore` isn't blocking important files

### Vercel Secrets Not Working
- Secrets are environment variables—set them in Vercel UI
- FIREBASE_PRIVATE_KEY must have proper newlines: `-----BEGIN...-----\n...\n-----END...-----\n`

---

## 📚 References
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/learn/basics/deploying-nextjs-app)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)

**Questions?** Check GitHub Actions logs or Vercel deployment logs for detailed error messages.
