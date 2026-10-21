---
title: Deploy to the home server and check on real phones over the LAN
type: HITL
labels: [ready-for-human]
---

## Parent

docs/prd/0001-planting-schedule-mvp.md

## What to build

Deploy the Docker Compose stack to the home server so that it is reachable on the farm network only. That means no port forwarding, and Postgres exposed only on the internal Docker network. Add a persistent volume for Postgres and a simple scheduled backup using `pg_dump` to a local folder. Write a short README covering how to:

- start the stack
- update it
- back up and restore the database
- reset a password with the CLI

A person then checks the app on the farm's phones.

## Acceptance criteria

- [ ] The app is reachable from a phone on the farm WiFi at a stable LAN address or hostname.
- [ ] The app is not reachable from outside the network, confirmed by checking the router.
- [x] Data survives a `docker compose down` followed by `up`, and a container rebuild. (Checked on this machine with a throwaway stack: `down`, then `up --build --force-recreate`.)
- [x] A backup runs on a schedule, and a restore has been tested once. (A dump is written when the stack starts and then every 24 hours. The 24-hour repeat has not been waited out. Restore was tested end to end: data added, dump taken, volume destroyed, dump restored, data back and the app answering. That test also exposed an overwrite problem with date-only file names, which is fixed.)
- [ ] Each Grower's phone can add the app to its home screen and stay logged in.

## Blocked by

- 01-tracer-scaffold-setup-login
