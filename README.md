# Entrepreneur Workspace

Internal workspace for the **Entrepreneur Division of HIMA**. It unifies business,
research, marketing, and operations in a single application, plus a public Open PO
page for customers who do not have an internal account.

> Status: **Foundations / app shell only.** Firebase integration is intentionally
> deferred; every data view currently uses local placeholder data.

## Requirements

- Node.js 20+ (see `docs/architecture.md` for the confirmed version)
- npm (the committed lockfile is `package-lock.json`)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in placeholders when Firebase work starts
npm run dev
```

Open <http://localhost:3000>. `/` redirects to `/dashboard`.

## Available scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |

## Project structure

```text
src/
  app/
    (workspace)/          Authenticated workspace route group
      dashboard/          Overview: KPIs, recent orders, tasks, activity
      business/           Products, Open PO campaigns, orders, inventory, finance
      research/           Research projects, reports, vendors, educational content
      marketing/          Campaigns, publishing calendar, social archive
      operations/         Tasks, timeline, team calendar
      reports/            Exports and executive dashboard
    po/                   Public Open PO pages (no internal account required)
  components/
    ui/                   Design-system primitives (button, card, input, label, badge)
    layout/               Sidebar, header, workspace shell
    shared/               Cross-feature components
  features/               Feature modules (empty until their tasks start)
  lib/                    Navigation, utils, and reserved auth/permissions/firebase dirs
  types/                  Shared TypeScript types
functions/src/            Reserved for Cloud Functions (not initialized)
docs/                     Project, architecture, data model, security, and task docs
```

## Conventions

- TypeScript strict mode; avoid `any`.
- Tailwind CSS v4 with design tokens defined in `src/app/globals.css`.
- Server-side validation and Firestore Security Rules are mandatory once data lands.
- Historical order price/HPP snapshots must never be recomputed from current prices.
- `.env*` files are git-ignored; only `.env.example` placeholders are committed.

## Documentation

Read these before implementing any task:

1. `docs/project.md` — product scope and users
2. `docs/architecture.md` — stack and module boundaries
3. `docs/data-model.md` — Firestore collections and invariants
4. `docs/security.md` — roles, rules, and secret handling
5. `docs/task.md` — ordered backlog and current task
