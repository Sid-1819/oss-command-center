This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install dependencies and configure the database (see [Database setup](#database-setup) below).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database setup

The app uses **AWS Aurora PostgreSQL** via Prisma for workflow state, plan reviews, and AI response caching.

### 1. Configure `DATABASE_URL`

Copy `.env.example` to `.env` and set the Aurora **writer endpoint** with SSL:

```bash
postgresql://USER:PASSWORD@database-1.cluster-xxxx.ap-south-1.rds.amazonaws.com:5432/postgres?sslmode=require
```

URL-encode special characters in the password.

### 2. Apply the schema

Run migrations against Aurora:

```bash
npm run db:migrate
```

This creates all required tables (`WorkflowContext`, `PlanReviewRecord`, `ActionRunState`, `AiResponseCache`, `Repository`).

For local schema experiments only (not recommended for shared Aurora):

```bash
npm run db:push
```

### 3. Verify

Optional — open Prisma Studio:

```bash
npm run db:studio
```

Confirm workflow persistence works: analyze a repo on the dashboard, then click a doc task in **AI Maintenance Queue**. It should navigate to `/app/doc?...` without a "Workflow unavailable" error.

### Migration commands

| Command | Purpose |
| --- | --- |
| `npm run db:migrate` | Apply pending migrations (use for Aurora / production) |
| `npm run db:migrate:dev` | Create and apply migrations in development |
| `npm run db:push` | Push schema without migration history (throwaway dev only) |
| `npm run db:studio` | Browse data in the database |

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Set `DATABASE_URL` in your deployment environment and run `npm run db:migrate` as part of your deploy pipeline (or run it once against Aurora before first deploy).

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
