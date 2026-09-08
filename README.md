# IECES News Manager

Desktop app for managing school news articles and photos for the **Isabela East Central Elementary School** website. Built with Electron + React + Supabase.

---

## Features

- 🔐 Login with Supabase email/password
- 📝 Create, edit, delete news articles
- 📸 Upload multiple photos per article (stored in Supabase Storage)
- 🗑️ Delete photos individually from within the app
- 🌐 Live on the website as soon as you publish (no redeploy needed)
- 🔄 Auto-update via GitHub Releases

---

## Setup (First-Time Only)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name it `ieces-news` (or anything you like)
3. Note your **Project URL** and **Anon Key** (Settings → API)

### 2. Run the SQL Migration

In Supabase → **SQL Editor** → New Query, paste the contents of `supabase-setup.sql` and click **Run**.

This creates the `news_articles` table, storage bucket `news-photos`, and all the security policies.

### 3. Create a Login Account

In Supabase → **Authentication** → **Users** → **Invite user**, enter the email of the teacher/admin who will use the app.

### 4. Configure the App

1. Copy `.env.example` → `.env`
2. Fill in your Supabase URL and Anon Key:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 5. Configure the Website (Next.js)

Add to your Next.js `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Replace `app/activities/page.tsx` with the `page.tsx` file in this repo.

---

## Development

```bash
npm install
npm run dev
```

---

## Build & Release

### Manual build (Windows):
```bash
npm run dist:win
```
Installer will be in `release/`.

### GitHub Release (Auto):
```bash
git tag v1.0.0
git push origin v1.0.0
```
GitHub Actions will build and attach the `.exe` installer to the release automatically.

**Required GitHub Secrets** (Settings → Secrets → Actions):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Project Structure

```
src/
  main.js          ← Electron main process
  preload.js       ← IPC bridge
  main.jsx         ← React entry point
  App.jsx          ← Auth routing
  lib/
    supabase.js    ← Supabase client
  pages/
    LoginPage.jsx
    DashboardPage.jsx
  components/
    Sidebar.jsx
    ArticleCard.jsx
    ArticleModal.jsx
    DeleteConfirmModal.jsx
    UpdateBanner.jsx
page.tsx            ← Drop-in Next.js replacement (reads from Supabase)
supabase-setup.sql  ← Run once in Supabase SQL Editor
```

## Student registration and teacher review

Apply `supabase/migrations/20260909000100_student_teacher_review.sql` after the existing Media auth migration, then deploy the updated registration function:

```bash
supabase functions deploy news-register --no-verify-jwt
```

Deploy the rebuilt app after the database and function changes. Student registration is open; teacher registration and ongoing access require the `news` allowed-users list. Existing Media accounts remain teachers and existing articles remain published. Roles and membership emails cannot be changed by clients.

Students see their own submissions and may edit/delete pending articles. Teachers see the pending review queue, edit the full article, and select **Approve and publish this article** when saving. Published student articles can only be changed by teachers. Public article reads only return published rows. Photo storage remains public by URL, as before; article approval does not make uploaded photo URLs private.

Verify with a student email outside the allowed list and a teacher email inside it: register both, submit a student article, confirm it is absent from anonymous article reads, approve it as the teacher, and confirm it becomes public. Also check that a student cannot update their role, approve articles, edit another student's work, or modify an approved article through the API.
