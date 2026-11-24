# API

Hono + PostgreSQL. MVC with a service layer:

```
request → routes → controllers → services → models → database
                        ↓
                      views → JSON
```

| Folder | Job | Must not |
|---|---|---|
| `routes/` | path → controller method | contain logic |
| `controllers/` | read the request, call one service, return a view | contain business rules or SQL |
| `services/` | business rules and transactions | know about HTTP |
| `models/` | one class per table; the only SQL | contain business rules |
| `views/` | choose which fields leave the API | query anything |
| `middleware/` | session, origin check, rate limit, errors | |
| `auth/` | Better Auth setup | |
| `database/` | connection and migrations | |

Request shapes live in `packages/contracts/src/api`, tables in `packages/db/src/pg`.

## Rules

- Every model method takes `userId` and filters by it.
- Money is an integer in minor units. Days are `YYYY-MM-DD` in the user's zone.
- Deleting sets `deletedAt` (devices need to learn about it); reads ignore such rows.
- `POST` accepts an `id` made on the device: sending it again returns the same row.
- Anything that reads before it writes runs in `store.transaction` and locks its parent row.
- Success is `{ data }`; failure is `{ error: { code, message, fields? } }`.

## Run

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Set `BETTER_AUTH_SECRET`, then:

```powershell
npm run dev -w @masrufi/api
```

Development uses PGlite (an embedded PostgreSQL), so there is nothing to install.
Tests use it too, in memory, with the real migrations:

```powershell
npm test -w @masrufi/api
```

After changing a table:

```powershell
npm run db:generate -w @masrufi/api
```
