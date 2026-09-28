# Gastos

A simple, private expense splitter for two household members — like Splitwise, scoped to just two people. Built as a web app so it can be installed on your phone's Home Screen (a PWA), starting local-only and adding cloud sync later.

## Phase 1 — MVP (you are here)

Everything runs locally in the browser, storing data in IndexedDB. No account, no backend yet.

```
npm install
npm run dev
```

Open the printed `localhost` URL. On first launch you'll set both names, then you're straight into the app: add an expense, see the running balance, settle up, browse history, and check monthly reports.

`npm run build && npm run preview` builds and serves the production bundle locally, useful for checking everything still works outside the dev server.

## Phase 2 — Install on your phone (live)

The app is deployed at **https://jregueira.github.io/gastos/** via GitHub Actions → GitHub Pages, redeploying automatically on every push to `master`.

**To install on iPhone:** open that link in Safari → Share → **Add to Home Screen**. It'll launch full-screen, no Safari address bar, with its own icon.

**To install on Android:** open the link in Chrome → menu (⋮) → **Add to Home screen** / **Install app**.

Two things worth knowing:

- **iOS may clear on-device data** after about a week of not opening the app. Use **Settings → Export backup** occasionally, or before a long gap, and **Import backup** to restore.
- **True push notifications** aren't available to local-only Home Screen apps on iOS without a server, so the "rent not logged" reminder on the Home screen is a simple in-app banner instead.

Note that the phone install and `npm run dev` use separate local databases (different origins), so expenses you add locally won't show up on the deployed version and vice versa — that's expected until Phase 3 adds sync.

## Phase 3 — Cloud sync (not yet built)

Once you're happy with the product, a Supabase-backed sync layer will let both phones see the same data in real time. The seam for this already exists at `src/sync/syncAdapter.ts` — nothing else in the app talks to a backend directly.

## Project structure

- `src/db/db.ts` — Dexie (IndexedDB) schema: people, categories, expenses, settlements, settings
- `src/lib/balances.ts` — pure "who owes whom" calculation, unit-testable and reused as-is once Phase 3 swaps the data source
- `src/lib/split.ts` — 50/50, custom, and "one owes it all" split math
- `src/screens/` — one file per screen (Home, AddExpense, History, SettleUp, Reports, Settings, Onboarding)
- `src/sync/syncAdapter.ts` — the Phase 3 seam mentioned above
