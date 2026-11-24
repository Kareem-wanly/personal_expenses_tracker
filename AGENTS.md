# Repository guide

npm workspaces; run commands from the repo root. See `ROADMAP.md` for the plan.

- `apps/web`: the Next.js site. **Read `apps/web/AGENTS.md` before touching it.**
- `packages/core`: pure domain logic. No DOM, React, Next, Node or database imports (the mobile app reuses it).
- `packages/contracts`: Zod validation. May import `core` only.
- `packages/db`: Drizzle schema and migrations. May import `core` only.

## Release notes ("ما الجديد")

Every user-facing change must add an entry at the top of `apps/web/src/lib/changelog.ts`
(new `version` = `YYYY.MM.DD`, short Arabic items, benefit first). The app shows
the latest entry once to each user after the update (`apps/web/src/components/whats-new.tsx`).
`npm test` checks that versions are unique and newest-first.
