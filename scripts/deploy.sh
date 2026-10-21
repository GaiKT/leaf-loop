#!/bin/sh
# Installs or updates Leaf Loop on this machine: checks .env, pulls the latest code, rebuilds, starts the stack
# and waits until the app answers.
#
#   ./scripts/deploy.sh             pull from git, then rebuild and start
#   ./scripts/deploy.sh --no-pull   rebuild and start what is already here
#
# Database migrations run by themselves (the "migrate" service) before the app starts. Data is kept in the
# "dbdata" volume and is never touched by this script.
set -eu
cd "$(dirname "$0")/.."

./scripts/preflight.sh

if [ "${1:-}" != "--no-pull" ] && [ -d .git ]; then
  echo "→ git pull"
  git pull --ff-only
fi

profile=""
if sed -n 's/^TUNNEL_TOKEN=//p' .env | grep -q .; then
  profile="--profile tunnel"
fi

echo "→ docker compose up --build"
# shellcheck disable=SC2086  # $profile is either empty or two words on purpose
docker compose $profile up -d --build

echo "→ รอแอปพร้อม"
tries=0
until docker compose exec -T app node -e "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" >/dev/null 2>&1; do
  tries=$((tries + 1))
  if [ "$tries" -gt 45 ]; then
    echo "✗ แอปยังไม่ตอบ ดู log:  docker compose logs --tail=50 migrate app"
    exit 1
  fi
  sleep 2
done

port=$(sed -n 's/^APP_PORT=//p' .env | head -n 1)
echo "✓ แอปพร้อมแล้ว  http://<IP ของ server>:${port:-3000}"
docker compose ps
