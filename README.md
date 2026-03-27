# SplitEase

A Splitwise-style expense splitting app built with:

- Next.js (App Router)
- Tailwind CSS + shadcn/ui
- PostgreSQL (Neon)
- Prisma
- NextAuth v5 (Google OAuth + Credentials)
- Vercel

## Getting started (local)

1. Install deps

```bash
npm install
```

2. Create `.env` in the project root and add:

```env
DATABASE_URL="..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

3. Push Prisma schema & run

```bash
npx prisma db push
npm run dev
```

Open `http://localhost:3000`.

## Deployment (Vercel)

Live app: https://splitwise-clone-project-liart.vercel.app

Add the same environment variables in Vercel Project Settings, then deploy.

## Demo video

Video file: `SplitEase_video.mp4`

If you add `SplitEase_video.mp4` to the repo root, you can reference it like:

[SplitEase_video.mp4](./SplitEase_video.mp4)

<video
  src="./SplitEase_video.mp4"
  controls
  autoplay
  muted
  loop
  playsinline
  style="max-width: 100%; height: auto; margin-top: 12px;"
></video>

