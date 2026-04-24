# AgencyPulse — Claude Instructions

## Project Overview
Multi-tenant SaaS analytics platform for marketing agencies — exact feature clone of AgencyAnalytics.com.
Agencies connect marketing platforms, fetch data via APIs, store as time-series, display in dashboards, generate automated reports.

## Repositories
- **Frontend**: `D:\projects\agencypulse` (React + Vite + TypeScript + Tailwind + Shadcn)
- **Backend**: `D:\projects\agency-backend` (NestJS + TypeScript + PostgreSQL + Redis)

## Documentation Files (ALWAYS read and update these)
- `D:\projects\agency-backend\docs\DECISIONS.md` — Every architecture/tech decision with reasoning
- `D:\projects\agency-backend\docs\FEATURES.md` — Every feature built, its status, and implementation notes
- `D:\projects\agency-backend\docs\CHALLENGES.md` — Every challenge faced and how it was resolved
- `D:\projects\agency-backend\docs\RESEARCH.md` — Platform research and competitive analysis notes
- `D:\projects\agency-backend\docs\STACK.md` — Confirmed tech stack with rationale
- `D:\projects\agency-backend\docs\PROGRESS.md` — Overall build progress tracker

## Working Rules (NON-NEGOTIABLE)
1. **ALWAYS read relevant docs before starting any task** — check FEATURES, DECISIONS, PROGRESS
2. **NEVER directly implement** — always plan first, present the plan, wait for user to say "proceed"
3. **One feature at a time** — complete one vertical slice fully before moving to next
4. **After each feature** — update FEATURES.md and PROGRESS.md
5. **After each decision** — update DECISIONS.md with what, why, and trade-offs
6. **After each challenge** — update CHALLENGES.md with problem, root cause, and fix
7. **Step-by-step within a feature**: DB schema → API design → Backend impl → Tests → Frontend integration
8. **Always explain** why we're doing something, how it works, what problem it solves

## Architecture Rules
1. Backend-first development — design DB and API before any frontend work
2. No direct API calls from frontend to external services (Google, Meta, etc.)
3. All external APIs handled via the backend integration layer
4. Use background jobs (BullMQ) for ALL data fetching — never on-demand API calls
5. Store normalized data in DB — frontend only talks to our backend
6. PostgreSQL Row Level Security (RLS) enforced for multi-tenancy — tenant_id on EVERY table
7. OAuth tokens encrypted at rest (AES-256-GCM)
8. Redis for caching + BullMQ queue backend

## Tech Stack (Confirmed — see STACK.md for full details)
- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL + Redis + BullMQ
- **Frontend**: React 19 + TypeScript + Vite + TailwindCSS v4 + Shadcn UI + TanStack Query + Zustand

## Key Architecture Decisions Made
- Shared schema multi-tenancy with PostgreSQL RLS (not schema-per-tenant)
- Plain PostgreSQL for metrics storage (BTREE indexes on tenant_id + recorded_at; TimescaleDB only if scale demands it)
- NestJS over Express for structure at this complexity level
- Separate backend repo (agency-backend) from frontend repo (agencypulse)
- BullMQ over other queue systems for Node.js ecosystem fit

## Frontend Notes
- The existing frontend at D:\projects\agencypulse is a reference/starting point only
- It is NOT the final source of truth — it may be incomplete, inconsistent, or broken
- As we build features: if frontend exists → fix and connect; if missing → build and connect
- The mixed Express+Prisma in the frontend will be removed — backend is separate

## What NOT To Do
- Do NOT build everything at once
- Do NOT make frontend changes before backend is ready
- Do NOT call external APIs directly from frontend
- Do NOT skip the planning step
- Do NOT overengineer — start simple, design for extensibility
- Do NOT blindly follow the existing frontend or research docs — they are references only
