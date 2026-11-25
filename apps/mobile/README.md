# Mobile app

Expo + React Native, Arabic only (right to left). It talks to `apps/api`.

| Folder | Job |
|---|---|
| `src/app/` | addresses only: each file points to a screen |
| `src/features/<name>/` | screens, their components (`.tsx`) and their logic (`use-*.ts`, plain `.ts`) |
| `src/ui/` | shared pieces: text, button, field, card… |
| `src/theme/` | colors (light and dark), fonts, spacing |
| `src/api/` | session, requests and queries |

Rules of money, dates and the sentence parser come from `packages/core`; API types from
`packages/contracts/src/api/responses.ts`. Never use `left`/`right` in styles: use `start`/`end`.

## Run

Start the API first (`apps/api/README.md`), then:

```powershell
npm run dev -w @masrufi/mobile
```

Press `w` for the browser or `a` for Android. On a phone, set `EXPO_PUBLIC_API_URL` to this
computer's network address in `apps/mobile/.env`, and add `exp://` to the API's `TRUSTED_ORIGINS`.

## Motion

`src/motion` is the only place that defines durations and springs. Use `Reveal` (arrive), `Swap`
(replace), `Collapse` (unfold), `PressableScale` (tap), `useGrow` (bars, rings), `useShake` (refuse)
and `haptics`. Everything follows the phone's "reduce motion" setting.

## Sheets

Forms and details open as sheets: add the component to `features/sheets/registry.tsx`, then
`useOpenSheet()("name", { id })`. What must stay above open sheets (toasts, the lock) goes inside
`Overlay` in `src/app/_layout.tsx`.

## Offline

- What the screens loaded is saved on the phone (`api/persist.ts`) for 7 days, so the app opens
  without a connection. Signing out erases it.
- Every change goes through `write.*` (`api/write.ts`), never `api.post` and the like. Without a
  connection, or while earlier changes still wait, it is queued (`api/outbox.ts`) and the call returns
  `QUEUED`: tell the user it was saved on the phone (`SAVED_ON_PHONE`) instead of closing as usual.
- The queue sends one change at a time, in order, and survives closing the app. A lost connection is
  retried forever; a refusal from the server is shown and dropped.
- New records need an `id` made on the phone (`randomUUID()`), so sending one twice cannot create two.
- Only the restore of a backup stays online-only.
