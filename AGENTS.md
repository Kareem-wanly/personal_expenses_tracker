# Repository guide

npm workspaces; run commands from the repo root. See `ROADMAP.md` for the plan.

- `apps/web`: the Next.js site. **Read `apps/web/AGENTS.md` before touching it.**
- `apps/api`: the server (MVC + services). **Read `apps/api/README.md` before touching it.**
- `apps/mobile`: the Expo app. **Read `apps/mobile/README.md` before touching it.**
- `packages/core`: pure domain logic. No DOM, React, Next, Node or database imports (the mobile app reuses it).
- `packages/contracts`: Zod validation. May import `core` only.
- `packages/db`: Drizzle schemas and migrations. May import `core` only.

## Code rules

- Code must be easy to read: clear names, small functions, one job per file, a comment only for the "why".
- A code file stays within **200 lines**. Longer only when splitting would make it worse.
  `npm run lint` checks it; older long files are listed in `scripts/long-files.json` and may only shrink.
- `apps/api` follows MVC with services: no SQL outside models, no business rules outside services.

## Branches

- Each phase of `ROADMAP.md` has its own branch (`phase/<n>-<name>`), started from the previous phase.
- Phases are merged at the end into a new branch, never into `main`: `main` is what is published.

## Release notes ("ما الجديد")

Every user-facing change must add an entry at the top of `apps/web/src/lib/changelog.ts`
(new `version` = `YYYY.MM.DD`, short Arabic items, benefit first). The app shows
the latest entry once to each user after the update (`apps/web/src/components/whats-new.tsx`).
`npm test` checks that versions are unique and newest-first.
