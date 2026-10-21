---
title: "Tracer: scaffold, first-run setup and login"
type: AFK
labels: [ready-for-agent]
---

## Parent

docs/prd/0001-planting-schedule-mvp.md

## What to build

The thinnest possible end-to-end app: Next.js (App Router, TypeScript) with Tailwind and daisyUI, Prisma with PostgreSQL, and a Docker Compose file that runs the app and Postgres together. Postgres is reachable only on the internal network.

On first visit, when no **Grower** exists, `/setup` asks for a farm name, a username and a password. It creates the **Farm**, pre-fills the green oak **Variety** with the default values from the PRD, and creates the first Grower. After that `/setup` is closed for good. The Grower logs in with the NextAuth Credentials provider (password hashed with argon2 or bcrypt) and lands on a mobile-first shell. The shell has a bottom tab bar (วันนี้ / โต๊ะ / แผน / ตั้งค่า) with empty pages and a logout action. A web app manifest and icons enable add-to-home-screen. All UI text is formal Thai.

Also set up Vitest so that later slices can add unit tests.

## Acceptance criteria

- [x] `docker compose up` starts the app and Postgres, and migrations run.
- [x] With an empty database, every route redirects to `/setup`. Submitting it creates the Farm, the green oak Variety and the first Grower, then logs that Grower in.
- [ ] Once a Grower exists, `/setup` returns not-found or redirects to login, and its action refuses to run. (The page returns 404. The action check is in place but has not been called directly.)
- [x] Unauthenticated requests to app routes redirect to login. Login with a wrong password shows a Thai error message.
- [ ] The session persists across browser restarts on a phone. (Cookie checked: HttpOnly, SameSite=Lax, expires in ~90 days. Not yet tried on a phone.)
- [ ] The shell renders at 360 px width with a bottom tab bar, and every label is in Thai.
- [ ] The manifest and icons are served, and Chrome on Android offers "Add to Home screen". (Manifest and icons are served. Not yet tried on Android; over plain HTTP Chrome may offer only a shortcut, not a full install.)
- [x] `npm test` runs Vitest; a placeholder test may be used until slice 04.

## Blocked by

None - can start immediately
