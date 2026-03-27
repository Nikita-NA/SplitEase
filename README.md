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

Add the same environment variables in Vercel Project Settings, then deploy.

