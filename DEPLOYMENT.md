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

### Step 3: Push code to GitHub ✅

- **Backend repo**: https://github.com/Kishanbm/agencypulse-backend (branch `main`, commit `1998d0f`)
- **Frontend repo**: https://github.com/Kishanbm/agencypulse-frontend (branch `main`, commit `0df5910`)
- Verified `.gitignore` excludes `.env*` in both repos before pushing.
- Render and Vercel will deploy from these `main` branches.

### Step 4: Backend on Render ✅

- **Service**: `agencypulse-backend` (Free tier, Node, Singapore region)
- **Live URL**: https://agencypulse-backend-aebb.onrender.com
- **Branch**: `main` (auto-deploy on push)
- **Build command**: `npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build`
- **Start command**: `npm run start:prod` → `node dist/src/main`
- **Cold start**: spins down after 15min idle, ~50s wake time (free tier limitation)

**Env vars set on Render**:
- App: `NODE_ENV=production`, `PORT=10000`, `APP_URL`, `FRONTEND_URL` (placeholder Vercel URL — updated in Step 5)
- DB: `DATABASE_URL`, `MIGRATION_DATABASE_URL` → Neon (same value)
- Redis: `REDIS_HOST`, `REDIS_PORT=6379`, `REDIS_PASSWORD`, `REDIS_TLS=true`
- JWT: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=7d`
- Encryption: `ENCRYPTION_KEY` (64-hex)
- Email: stub values (`SMTP_HOST=localhost`) — invitations will fail until Resend/etc. configured
- Sync: `SYNC_CRON=0 */6 * * *`

**Code changes required during deploy**:
1. Added opt-in Redis TLS support in `app.module.ts` and `cache.service.ts` (`REDIS_TLS=true` env flag) — Upstash requires TLS. Commit `7923ac1`.
2. Fixed `start:prod` script in `package.json` from `node dist/main` → `node dist/src/main` (nest build outputs under `dist/src/`). Commit `28d6fe3`.

**Manual one-time setup on Neon (SQL editor)** — required because the migration history assumes locally-created roles + a function that's never created in any migration:
```sql
-- Create the two app roles the RLS migrations grant to.
-- For staging only: both alias to neondb_owner (RLS not enforced).
CREATE ROLE agencypulse;
GRANT neondb_owner TO agencypulse;
CREATE ROLE agencypulse_app;
GRANT neondb_owner TO agencypulse_app;

-- Pre-create set_updated_at() trigger function — referenced in
-- 20260417000003_integration_connections but never defined in any migration.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Known issues to fix before production**:
- `set_updated_at()` should be added as a proper migration (not pre-seeded manually)
- App roles should have least-privilege grants (not `GRANT neondb_owner`) so RLS actually enforces
- Production Postgres should use a non-owner role for the app + a separate owner role for migrations

#### Step 4 — Full troubleshooting log

The backend deploy took **~7 attempts** to go green. Each failure and the fix is recorded here so we don't re-discover any of these the next time.

**Issue 1: `.claude/settings.local.json` accidentally committed → GitGuardian leak alert**
- *Symptom*: GitGuardian email — Bearer Token (JWT) detected in `agencypulse-frontend` repo within minutes of the first push.
- *Root cause*: A demo agency-owner JWT had been allow-listed in `.claude/settings.local.json` from an earlier `curl` test command. That file got picked up by `git add .`.
- *Severity*: Low. The JWT had a 15-minute lifetime (`iat`/`exp` already expired by months) and was signed by the local backend's secret — backend wasn't deployed yet.
- *Fix planned* (still pending): add `.claude/settings.local.json` to `.gitignore` in both repos, `git rm --cached`, and commit. Force-purge from history skipped (token already dead).

**Issue 2: BullMQ + ioredis didn't enable TLS → Upstash refuses connection**
- *Symptom*: First boot would have failed (caught before deploy).
- *Root cause*: `app.module.ts` (BullMQ) and `cache.service.ts` (ioredis cache) created Redis connections with `host`/`port`/`password` only — no `tls: {}` option. Upstash requires TLS (`rediss://`).
- *Fix*: Added an opt-in flag — when `REDIS_TLS=true`, both connections spread `{ tls: {} }` into the config. Local dev (`REDIS_TLS` unset) is unaffected and continues using plain TCP to localhost.
- *Commit*: `7923ac1` — "Add opt-in Redis TLS support for managed providers (Upstash)"

**Issue 3: Migration `20260416000001_rls_policies` failed — role `agencypulse` does not exist**
- *Symptom*: `ERROR: role "agencypulse" does not exist` (Postgres SQLSTATE `42704`) during `prisma migrate deploy`.
- *Root cause*: The RLS policies migration runs `GRANT ... TO agencypulse` and `CREATE POLICY ... TO agencypulse`. On the local dev DB this role exists (created manually as part of the dev setup); on a fresh Neon DB it doesn't. Neon's owner role is `neondb_owner`.
- *Fix*: Created the role on Neon as an alias for `neondb_owner` (staging only — RLS will not actually enforce since both roles are owners; acceptable because the goal is UI review, not a security audit).
  ```sql
  CREATE ROLE agencypulse;
  GRANT neondb_owner TO agencypulse;
  ```

**Issue 4: Migration `20260417000001_client_user_assignments` failed — role `agencypulse_app` does not exist**
- *Symptom*: Same SQLSTATE `42704`, different role name. Five more migrations applied successfully before this one.
- *Root cause*: A later migration (`20260417000004_correct_rls_app_role`) renames the app role from `agencypulse` to `agencypulse_app`, but earlier migrations between #2 and #4 already reference `agencypulse_app`. The dev DB had both roles.
- *Fix*: Created the second role the same way.
  ```sql
  CREATE ROLE agencypulse_app;
  GRANT neondb_owner TO agencypulse_app;
  ```

**Issue 5: Prisma P3009 — half-applied migration blocks all retries**
- *Symptom*: After Issue 4 was fixed, redeploy still failed: `migrate found failed migrations in the target database, new migrations will not be applied`.
- *Root cause*: Prisma records a "started but failed" entry in `_prisma_migrations` when a migration errors mid-way. New attempts refuse to run until that entry is resolved (either marked as rolled back or the DB is reset).
- *Fix*: Wiped and recreated the public schema — clears the migrations table and any half-applied tables in one shot. Roles survive (they're cluster-level, not schema-level).
  ```sql
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  GRANT ALL ON SCHEMA public TO neondb_owner;
  GRANT ALL ON SCHEMA public TO agencypulse;
  GRANT ALL ON SCHEMA public TO agencypulse_app;
  ```

**Issue 6: Migration `20260417000003_integration_connections` failed — function `set_updated_at()` does not exist**
- *Symptom*: SQLSTATE `42883` — function not found. Comment in the SQL says "set_updated_at() function already exists from the initial schema migration" but it doesn't.
- *Root cause*: Bug in the codebase. The initial schema defines a trigger function called `update_updated_at_column()`. Migration `20260417000003` references a *differently-named* `set_updated_at()` and assumes it exists. It only works on the local dev DB because someone created the function manually at some point.
- *Fix*: Pre-seeded the function in Neon as part of the wipe SQL. Avoided rewriting the historical migration (committed migrations should be immutable).
  ```sql
  CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
  ```
- *Follow-up needed*: Add a proper migration that creates this function so a fresh DB doesn't need manual seeding.

**Issue 7: Build failed — `sh: 1: nest: not found`**
- *Symptom*: `npm install` succeeded, Prisma migrations succeeded, then `npm run build` (= `nest build`) failed because the `nest` CLI binary wasn't on `PATH`.
- *Root cause*: Render's default `npm install` skips `devDependencies` in production, and `@nestjs/cli` (which provides `nest`) is in devDependencies.
- *Fix*: Changed Render build command from `npm install ...` to `npm install --include=dev ...` so the CLI is installed.

**Issue 8: Boot failed — `Cannot find module '/opt/render/project/src/dist/main'`**
- *Symptom*: Build succeeded, then `node dist/main` (the start:prod script) crashed at startup — file not found.
- *Root cause*: The `tsconfig.json` includes files outside `src/` (e.g. `prisma/`), so TypeScript preserves the `src/` directory in the output. `nest build` actually emits to `dist/src/main.js`, not `dist/main.js`. The script was wrong.
- *Fix*: Updated `package.json`: `"start:prod": "node dist/main"` → `"start:prod": "node dist/src/main"`.
- *Commit*: `28d6fe3` — "Fix start:prod path — nest build outputs to dist/src/main"

**Issue 9: Service booted, but `WRONGPASS invalid username-password pair` flooding logs**
- *Symptom*: Render shows "Service is live", but logs show endless `ReplyError: WRONGPASS` from Redis. App boots because Redis errors aren't fatal — they just cripple BullMQ and caching.
- *Root cause*: The literal placeholder string `<paste-the-Upstash-token-from-TCP-tab>` was pasted into `REDIS_PASSWORD` instead of being replaced with the actual Upstash token.
- *Fix*: Edited `REDIS_PASSWORD` on Render → pasted the real token from Upstash console (TCP tab → password portion of the connection string). Service auto-redeployed clean.

**Lessons captured for next environment**:
- Add `.claude/settings.local.json` to global `.gitignore` template — never useful in a repo.
- Migrations need a real fresh-DB test pass before staging deploys (the dev DB has accumulated manual fixes that hide bugs).
- For any platform that requires TLS Redis (Upstash, Redis Cloud, etc.), the `tls: {}` flag must be opt-in via env so local Docker Redis still works.
- `start:prod` paths should match `nest build` output exactly — verify locally before deploy.
- When pasting placeholders into env-var lists, replace them all before saving.

### Step 5: Frontend on Vercel ✅

- **Project**: `agencypulse-frontend`
- **Live URL**: https://agencypulse-frontend.vercel.app
- **Branch**: `main` (auto-deploy on push)
- **Framework preset**: Vite (auto-detected)
- **Build command / output**: defaults (`npm run build` → `dist/`)

**Env vars set on Vercel**:
- `VITE_API_BASE_URL=https://agencypulse-backend-aebb.onrender.com/api/v1`
  - Read by `src/lib/api.ts`. Falls back to `http://localhost:3000/api/v1` for local dev.
  - Set for all environments (Production, Preview, Development).
  - Vercel only injects env vars at build time — must redeploy after adding/changing.

**Backend env updates (Render) to wire CORS + invite links**:
- `FRONTEND_URL=https://agencypulse-frontend.vercel.app` (used by CORS allowlist + OAuth callback redirects)
- `APP_URL=https://agencypulse-frontend.vercel.app` (used in invite-email links)
- Backend's CORS supports comma-separated origins, so additional preview URLs can be added later (e.g. `https://agencypulse-frontend.vercel.app,https://agencypulse-frontend-git-feature.vercel.app`).

**End-to-end verified**:
- Registration → JWT issued, agency + owner user created in Neon
- Login → access token persisted
- Authenticated API calls (`/clients`, `/notifications/stream`) return 200 with correct tenant scoping
- No CORS errors in browser console

**Known limitations (staging only)**:
- Email/SMTP is stubbed → invitation emails will fail to send. Acceptable for client review since they sign up themselves.
- File storage is stubbed (`STORAGE_ENDPOINT=http://localhost:9000`) → logo/avatar uploads will fail. Workaround for production: switch to Cloudflare R2 or AWS S3.
- No external integrations connected yet (Google Ads, Meta, etc.) — the "Add Client" flow works but no real data will sync until OAuth credentials are added per platform.
- Backend cold start: first request after 15min idle takes ~50s. Acceptable for client demos, painful for marketing traffic — upgrade Render to Starter ($7/mo) when starting paid acquisition.

## Summary

| Service | URL / ID | Cost |
|---|---|---|
| Frontend | https://agencypulse-frontend.vercel.app | Free (Vercel Hobby) |
| Backend API | https://agencypulse-backend-aebb.onrender.com | Free (Render — sleeps after 15min idle) |
| PostgreSQL | Neon project `agencypulse-staging` (Singapore) | Free (0.5GB) |
| Redis | Upstash `agencypulse` (Mumbai) | Free (256MB, 500k cmd/mo) |
| **Total** | | **$0/month** |

## Pending follow-ups

1. **Rotate leaked credentials** (low priority — both already neutralized but should be reset):
   - Neon `neondb_owner` password (was pasted in chat during setup)
   - Upstash Redis token (was pasted in chat during setup)
2. **Gitignore `.claude/settings.local.json`** in both repos and `git rm --cached` to stop GitGuardian alerts.
3. **Add a proper migration** for `set_updated_at()` so fresh DBs don't need manual seeding.
4. **Fix `tsconfig.json`** to scope build to `src/` only — that way `dist/main.js` works and the start script is conventional.
5. **Real email + storage** (Resend free tier + Cloudflare R2 free tier) before sending the staging URL to actual prospects.
6. **Connect at least one integration** (e.g. Google Ads sandbox) so the dashboard shows non-empty data for the client review.
