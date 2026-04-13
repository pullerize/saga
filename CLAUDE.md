# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Premium door system calculator and management platform for the SAGA brand. Full-stack Next.js application replacing the original static vanilla JS calculator.

**Brand color:** `rgba(10,60,70,0.84)` → HSL `190, 75%, 16%` — deep teal. Gold accent `hsl(38, 60%, 55%)` for premium highlights.

## Commands

```bash
npm run dev       # Start dev server (Turbopack, port 3000)
npm run build     # Production build
npm run lint      # ESLint
npx prisma generate         # Regenerate Prisma client after schema changes
npx prisma migrate dev      # Apply DB migrations (requires PostgreSQL)
npx prisma db seed          # Seed database with data from old calculator
```

## Architecture

### Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **UI:** Tailwind CSS v4 + custom Shadcn-style components + Framer Motion
- **State:** Zustand (`src/stores/calculator.ts`)
- **DB:** PostgreSQL + Prisma 6 ORM
- **Auth:** NextAuth.js v5 (roles: ADMIN, MANAGER, PARTNER)
- **PDF:** @react-pdf/renderer
- **Fonts:** Inter (body) + Playfair Display (headings, `font-display` class)

### Route Structure

```
/                           — System selection (public)
/calculator/[systemType]    — Multi-step configurator (public)
/auth/login                 — Login page
/auth/register              — Partner registration
/admin/                     — Dashboard (ADMIN only)
/admin/prices               — Price management
/admin/systems              — System constructor (CRUD)
/admin/users                — User management
/admin/services             — Additional services config
/admin/analytics            — Archive & analytics
/partner/                   — Partner dashboard
/partner/calculations       — Calculation history
/partner/pricing            — Partner-specific prices
```

### Key Directories

- `src/components/ui/` — Base UI components (Button, Card, Input, Badge)
- `src/components/calculator/` — Calculator wizard steps
- `src/components/admin/` — Admin panel components
- `src/components/shared/` — Header, Footer, Logo
- `src/components/home/` — Landing/home page sections
- `src/lib/calculations/` — Ported calculation engine (from old calc-functions.js)
- `src/stores/` — Zustand stores
- `src/types/` — Shared TypeScript types
- `prisma/schema.prisma` — Database schema

### Design System

CSS variables defined in `src/app/globals.css`:
- `--brand-50` through `--brand-950` — brand color palette
- `--gold`, `--gold-light`, `--gold-dark` — gold accent
- Utility classes: `.brand-gradient`, `.gold-gradient`, `.glass-effect`, `.premium-shadow`, `.premium-shadow-lg`, `.text-brand-gradient`
- Tailwind theme tokens: `bg-brand-700`, `text-gold`, etc.

### Database Schema (Prisma)

Core models: `User`, `DoorSystem`, `Subsystem` (params as JSONB), `Component`, `PartnerPrice`, `GlassType`, `ShotlanOption`, `AdditionalService`, `Calculation`.

**Key design decisions:**
- Subsystem `params` is JSONB — allows flexible param structures per system type
- `Calculation.components` is JSON — freezes prices at calculation time
- `PartnerPrice` overrides per partner, falls back to `Component.defaultPrice`

### Calculator State (Zustand)

`useCalculatorStore` in `src/stores/calculator.ts` replaces the old global `selected` object. Tracks: system, subsystem, dimensions, glass, shotlan, services, step, and computed results.

### Migration from Old Calculator

The original static calculator is at `../saga_calc/`. Key files to port:
- `assets/scripts/calc-functions.js` — 6 calculation functions → `src/lib/calculations/engine.ts`
- `assets/scripts/systems/systemsData.js` — System/subsystem definitions → DB seed
- `assets/scripts/calc-constants.js` — Prices and names → DB seed
- `assets/scripts/images.js` — Media URLs → DB records

The shotlan calculation logic is duplicated 6 times in the old code — extract once into `src/lib/calculations/shotlan.ts`.

## Supported Door Systems

cascade, sync, unlinked, embedded-wall, partition, wall-mounted, angle — each with unique subsystems and calculation logic. See `prisma/schema.prisma` for the data model.
