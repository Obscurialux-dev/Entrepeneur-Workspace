# Entrepreneur Workspace

Internal workspace for the **Entrepreneur Division of HIMA**. It unifies business,
research, marketing, and operations in a single application, plus a public Open PO
page for customers who do not have an internal account.

> Status: **Firebase integration in progress.** Products are stored in Firestore behind
> Firebase Auth sessions and custom-claim roles; the remaining modules are placeholder pages.

## Requirements

- Node.js 20+ (see `docs/architecture.md` for the confirmed version)
- npm (the committed lockfile is `package-lock.json`)
- JDK 21+ **only** for the Firebase Emulator Suite (`npm run test:emulator`); firebase-tools 15
  refuses older Java versions

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in real values locally; never commit them
npm run check:env            # reports missing variable NAMES only (never values)
npm run dev
```

Open <http://localhost:3000>. `/` redirects to `/dashboard`.

For a fully local stack, start the emulators (`npx firebase emulators:start --only firestore,auth`),
set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` and the `*_EMULATOR_HOST` variables in `.env.local`,
then create an account and assign a role:

```bash
npm run set:role -- user@example.com research
```

`.firebaserc` points the default project at `demo-entrepreneur-workspace`, so the emulators run
without a real Firebase project. Run `npx firebase use --add` before deploying anywhere real.

## Available scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript rules) |
| `npm test` | Unit tests via the built-in Node.js test runner (`node --test src`) |
| `npm run test:emulator` | Full suite incl. Firestore integration + security rules against the emulators |
| `npm run check:env` | Validate required environment variables (prints names, not values) |
| `npm run set:role` | Assign a workspace role as a Firebase Auth custom claim |

## Current functionality

| Area | Status |
| --- | --- |
| App shell (sidebar, header, breadcrumb, loading/error states) | Done |
| Dashboard overview | UI shell with placeholder data |
| **Products & variants (T020)** | **Functional on Firestore (Admin SDK, server-side)** |
| **Firebase Auth session + role checks (T012/T013)** | Google sign-in, session cookie, custom-claim roles |
| **Firestore Security Rules (T014)** | Deny-by-default, tested with the emulator |
| Open PO, orders, inventory, finance, research, marketing, operations, reports | Placeholder pages |

### Products & variants

`/business/products` provides search, status filtering, pagination, margin indicators and an
empty state. `/business/products/new` and `/business/products/[productId]` provide create/edit,
lifecycle status changes and variant management (add/edit/delete, price/HPP overrides).

All writes go through Server Actions that re-check authorization (`requirePermission`) and
re-validate every field with Zod. Money is stored as integer IDR; SKUs are unique and normalized
to uppercase; `createdAt`/`createdBy` are immutable.

> **Persistence.** Products and variants live in Firestore (`products/{id}` +
> `products/{id}/variants/{variantId}`), written through the Admin SDK in Server Actions so
> requests are server-authorized. Timestamps use `FieldValue.serverTimestamp()`; `createdAt` and
> `createdBy` are immutable. `JsonProductRepository` remains as a local fallback for tests only.
>
> **Authorization.** Roles (`entrepreneur_admin`, `research`, `marketing`, `executive_viewer`) come
> from Firebase Auth custom claims and are enforced in `requirePermission()` and mirrored in
> `firestore.rules`. Marketing is read-only on products. Only admins can delete products or change
> roles. Anonymous requests get no permissions.
>
> **Prototype session.** During local development, and only when `NODE_ENV !== "production"` **and**
> `WORKSPACE_PROTOTYPE_ROLE` is set, a session without a cookie falls back to that role. An invalid
> or expired session cookie never falls back — it resolves to an anonymous session. The product
> pages show an explicit banner while the prototype session is active. Remove the fallback before
> deployment.

To reset local product data, run against the emulator (`npm run test:emulator` clears its own
data) or delete the documents in the Firestore emulator UI. The legacy `.data/products.json`
fallback is only used by `JsonProductRepository` in unit tests.

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
  features/               Feature modules (`products/` implemented; others start with their tasks)
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
