---
title: Grower management
type: AFK
labels: [ready-for-agent]
---

## Parent

docs/prd/0001-planting-schedule-mvp.md

## What to build

In Settings, a logged-in **Grower** can manage accounts:

- **Create** another Grower with a username and a temporary password.
- **Reset** another Grower's password to a temporary one.
- **Delete** another Grower.
- **Change** their own password.

A Grower with a temporary password must change it before using the app. A CLI script run on the server resets any Grower's password. That covers the case where every Grower is locked out. All Growers have the same permissions.

## Acceptance criteria

- [x] Creating a Grower with a username that already exists is rejected with a Thai message.
- [x] A new or reset Grower is redirected to a change-password screen until they set a new password.
- [x] Deleting the last remaining Grower is refused. (Checked in code only. From the screen a Grower cannot delete their own account, so the case cannot be reached.)
- [x] A deleted Grower can no longer log in, and any session they still have stops working. (The open session was sent to the login page right after deletion. A fresh login by the deleted name was not tried.)
- [x] Changing your own password requires the current password.
- [x] The CLI script (e.g. `npm run reset-password -- <username>`) prints a temporary password and sets the must-change flag.

## Blocked by

- 01-tracer-scaffold-setup-login
