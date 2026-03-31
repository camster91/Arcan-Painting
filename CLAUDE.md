# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

Arcan Painting is a full-stack web application for a painting business. It includes:
- **Public marketing website** - Landing page with services, process, FAQ, about, and contact sections
- **Admin CRM dashboard** - Business management system for leads, clients, estimates, contracts, invoices, projects, scheduling, and team management

## Tech Stack

- **Framework**: React Router 7 with Hono server
- **Language**: JavaScript (JSX) for pages/components, TypeScript for configs and utilities
- **Styling**: Tailwind CSS 3 + Chakra UI 2.8
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Database**: Neon (serverless PostgreSQL)
- **Authentication**: @auth/core with @hono/auth-js
- **Build Tool**: Vite
- **Testing**: Vitest with Testing Library
- **Package Manager**: Bun

## Development Commands

```bash
bun run dev          # Start development server
bun run typecheck    # Run TypeScript type checking (react-router typegen && tsc --noEmit)
bun test             # Run tests with Vitest
```

## Project Structure

```
src/
├── app/                    # Main application code (file-based routing)
│   ├── page.jsx           # Homepage (public marketing site)
│   ├── layout.jsx         # Root layout
│   ├── routes.ts          # Route configuration (auto-generates from file structure)
│   ├── admin/             # Admin dashboard pages
│   │   ├── page.jsx       # Admin dashboard home
│   │   ├── leads/         # Lead management
│   │   ├── clients/       # Client management
│   │   ├── estimates/     # Estimate creation/management
│   │   ├── contracts/     # Contract management
│   │   ├── invoices/      # Invoice management
│   │   ├── projects/      # Project tracking
│   │   ├── scheduling/    # Calendar/scheduling
│   │   ├── team/          # Team management
│   │   └── settings/      # Admin settings
│   ├── account/           # User account pages
│   ├── api/               # API routes (Hono handlers)
│   └── thank-you/         # Thank you page
├── components/            # Reusable React components
│   ├── admin/            # Admin-specific components
│   └── *.jsx             # Public site components (Header, Footer, etc.)
├── hooks/                # Custom React hooks
├── contexts/             # React context providers
├── utils/                # Utility functions
└── __create/             # Framework utilities (HMR, fetch helpers, etc.)
```

## File Conventions

- **Routes**: File-based routing using `page.jsx` files
  - `src/app/page.jsx` → `/`
  - `src/app/admin/page.jsx` → `/admin`
  - `src/app/admin/leads/page.jsx` → `/admin/leads`
  - Dynamic routes use `[param]` folders (e.g., `[id]/page.jsx`)
  - Catch-all routes use `[...param]` folders

- **API Routes**: Located in `src/app/api/` directory

- **Components**: PascalCase naming (e.g., `HeroSection.jsx`, `LeadCard.jsx`)

## Architecture Patterns

- **Path aliases**: Use `@/` to import from `src/` (e.g., `import { something } from '@/utils/helper'`)
- **Layouts**: `layout.jsx` files wrap child routes
- **State**: Zustand stores for global state, React Query for server state
- **Styling**: Prefer Tailwind utility classes; Chakra UI for complex interactive components

## Key Components

Public site sections (in `src/components/`):
- `Header.jsx` - Navigation bar
- `HeroSection.jsx` - Main landing banner
- `ServicesSection.jsx` - Services offered
- `ProcessSection.jsx` - Work process steps
- `FAQSection.jsx` - Frequently asked questions
- `ContactSection.jsx` - Contact form
- `Footer.jsx` - Site footer

Admin components (in `src/components/admin/`):
- Lead management cards and forms
- Estimate builders
- Project tracking UI
- Scheduling/calendar components

## Testing

Tests are configured with Vitest and jsdom environment. Setup file: `test/setupTests.ts`

```bash
bun test             # Run all tests
bun test --watch     # Watch mode
```
