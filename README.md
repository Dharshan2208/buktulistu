# Buktu Listu

A private, single-owner bucket list built with React, Vite, and a Cloudflare
Worker backed by D1. The owner can add, edit, complete, and delete items. Friends
can sign in with a separate shared password and browse the same list in a
read-only interface.

## Local development

Requirements: a current Node.js release, npm, and a Cloudflare account when
working with remote D1 or deploying.

```bash
npm install
cp .dev.vars.example .dev.vars
```

Replace every placeholder in `.dev.vars`. Generate a strong session signing
secret, for example:

```bash
openssl rand -base64 48
```

Create the local D1 schema and start the app:

```bash
npx wrangler d1 migrations apply bucketlist-db --local
npm run dev
```

Migration `0002` adds example items. Remove or edit that migration before the
first migration run if a new deployment should begin empty.

Useful checks:

```bash
npm run lint
npm run build
```

## Production deployment

The checked-in `wrangler.jsonc` binds the Worker to the existing
`bucketlist-db` D1 database. For a different Cloudflare account, create a D1
database and replace the binding's `database_id` with the value Wrangler
returns:

```bash
npx wrangler d1 create bucketlist-db
```

Store credentials as encrypted Worker secrets. Do not add them to
`wrangler.jsonc`, an `.env` file, or source control.

```bash
npx wrangler secret put OWNER_PASSWORD
npx wrangler secret put VIEWER_PASSWORD
npx wrangler secret put SESSION_SECRET
```

Use different, strong owner and viewer passwords. `SESSION_SECRET` should be a
long random value and must not be either password. Then apply migrations and
deploy:

```bash
npx wrangler d1 migrations apply bucketlist-db --remote
npm run deploy
```

Run the remote migration before deploying code that depends on it. Rotating
`SESSION_SECRET` invalidates every current session. Rotating either password
does not invalidate already-issued sessions, so rotate `SESSION_SECRET` too if
immediate revocation is required.

## Access model

The API, not the React interface, is the authorization boundary.

| Session | Read items | Create | Update/complete | Delete |
| --- | --- | --- | --- | --- |
| None | `401` | `401` | `401` | `401` |
| Viewer | `200` | `403` | `403` | `403` |
| Owner | `200` | `201` | `200` | `204` |

The UI mirrors these capabilities: viewers see a read-only badge, static
completion indicators, no add/edit/delete controls, no mutation modals, and a
viewer-specific empty state. A stale session that receives `401` during a
mutation is returned to the password gate. A `403` is explained as a read-only
session rather than as a generic failure.

## Security notes

- The session cookie contains only a role and expiry. It is signed with
  HMAC-SHA256, is `HttpOnly` and `SameSite=Lax`, and receives `Secure` on HTTPS.
- The Worker verifies the signature and expiry on every protected request.
  Client-side role checks are presentation only; all mutations call the
  server-side owner guard.
- State-changing API requests with a foreign `Origin` are rejected. API
  responses disable caching and MIME sniffing and include a request ID.
- Password checks compare fixed-length HMAC digests to avoid content-dependent
  string comparison timing. Secrets stay in `.dev.vars` locally and encrypted
  Worker secrets in production.
- This is intentionally a shared-password model, not individual user accounts.
  It has no per-person revocation, identity audit trail, password recovery, or
  built-in login rate limit. For a public/high-risk deployment, add Cloudflare
  rate limiting or Access, monitoring, and individual identities.

Never commit `.dev.vars`; it is ignored by Git. Treat the viewer password as
private because it grants access to the entire list, and treat the owner
password and session secret as higher-impact credentials.

## API routes

- `POST /api/auth` — sign in with `{ "password": "..." }`
- `GET /api/auth/me` — return the active role
- `POST /api/auth/logout` — clear the session cookie
- `GET /api/items` — list items for an authenticated session
- `POST /api/items` — create an item (owner only)
- `PATCH /api/items/:id` — edit or complete an item (owner only)
- `DELETE /api/items/:id` — delete an item (owner only)
- `GET /api/health` — health check
