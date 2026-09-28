# Gastos

A shared expense splitter for a household — like Splitwise. Any number of people can sign in, join a household via an invite code, and see each other's expenses and balances live. Built as a web app so it can be installed on a phone's Home Screen (a PWA).

Live at **https://jregueira.github.io/gastos/**, auto-deployed via GitHub Actions on every push to `master`.

## Setup

```
npm install
```

Create `.env.local` (see `.env.example`) with your Supabase project's URL and anon key:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Then:

```
npm run dev
```

First launch prompts you to sign up (email + password), then create a household or join one with an invite code. From there: add an expense (equal, custom, or "one owes it all" splits across any number of members), see the running balance, settle up, browse history, and check monthly reports. Settings has an "Invite people" section with a shareable code/link.

`npm run build && npm run preview` builds and serves the production bundle locally.

## Backend

Supabase (Postgres + Auth + Realtime) is the only data store — the app is online-only, no offline cache. Schema and RLS policies live in `supabase/migrations/`. To apply them to a project:

```
npx supabase login --token <personal-access-token>
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Row Level Security scopes every table to `group_id`, checked against `group_members`. Two `SECURITY DEFINER` RPCs (`create_group`, `join_group`) handle the chicken-and-egg problem of adding the first member to a brand-new group.

## Installing on your phone

**iPhone:** open the live link in Safari → Share → **Add to Home Screen**. **Android:** open in Chrome → menu (⋮) → **Add to Home screen** / **Install app**. Both launch full-screen with no browser chrome.

## Deployment

GitHub Actions builds and deploys to GitHub Pages on every push to `master` (`.github/workflows/deploy.yml`). It needs `SUPABASE_URL` and `SUPABASE_ANON_KEY` set as repo secrets (Settings → Secrets and variables → Actions) — Vite inlines `VITE_*` env vars at build time.

## Project structure

- `supabase/migrations/` — schema, RLS policies, and the `create_group`/`join_group` RPCs
- `src/data/` — Supabase client, realtime-backed hooks (`useMembers`, `useCategories`, `useExpenses`, `useSettlements`), and snake_case↔camelCase mappers
- `src/auth/` — `AuthContext`/`useAuth`, wrapping Supabase Auth sessions
- `src/group/GroupContext.tsx` — the signed-in user's current household, provided to every screen
- `src/lib/balances.ts` — per-member net balance calculation + greedy debt-simplification (minimal suggested settlements)
- `src/lib/split.ts` — equal / custom / "one owes it all" split math for an arbitrary list of participants
- `src/screens/` — one file per screen (Auth, GroupSetup, Home, AddExpense, History, SettleUp, Reports, Settings)
