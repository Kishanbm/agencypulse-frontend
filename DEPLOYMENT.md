# AgencyPulse — Staging Deployment

Free-tier deployment for client review, testing, and early marketing. **Not production.**

## Stack

| Layer | Service | Notes |
|-------|---------|-------|
| Frontend | Vercel | React + Vite, auto-deploy from GitHub |
| Backend | Render (free) | NestJS, accepts cold starts (~30s after 15min idle) |
| Database | Neon | PostgreSQL, free 0.5GB, no sleep |
| Redis | Upstash | BullMQ backend, free 10k commands/day |

## Steps

### Step 1: Neon PostgreSQL ✅

- **Project**: agencypulse-staging
- **Region**: AWS Asia Pacific (Singapore) — `ap-southeast-1`
- **Database**: `neondb` (default Neon db; staging uses as-is)
- **Connection string**: stored as `DATABASE_URL` (do not commit)
  ```
  postgresql://neondb_owner:***@ep-billowing-star-aoe1io2o.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
  ```
- Notes: Neon free tier — 0.5GB storage, no sleep. SSL required (`sslmode=require`).

### Step 2: Upstash Redis ✅

- **Database**: agencypulse
- **Region**: AWS Mumbai — `ap-south-1`
- **Endpoint**: `uncommon-pika-112945.upstash.io:6379`
- **TLS**: enabled — connection URL must use `rediss://` (not `redis://`)
- **Connection string**: stored as `REDIS_URL` (do not commit), TCP tab from Upstash console
  ```
  rediss://default:<token>@uncommon-pika-112945.upstash.io:6379
  ```
- Notes: Free tier — 500k commands/month, 256MB, 50GB bandwidth. Region differs from Neon (Singapore) — adds ~30-40ms backend↔Redis latency. Acceptable for staging.
