#!/bin/sh
# Checks the things that most often go wrong before a first start or an update. Safe to run at any time; it only
# reads. Run it from anywhere:  ./scripts/preflight.sh
set -u
cd "$(dirname "$0")/.." || exit 1

fail=0
ok() { echo "✓ $1"; }
bad() { echo "✗ $1"; fail=1; }
warn() { echo "! $1"; }

command -v docker >/dev/null 2>&1 && ok "มี docker" || bad "ไม่พบ docker (ติดตั้ง Docker ก่อน)"
docker compose version >/dev/null 2>&1 && ok "มี docker compose" || bad "ไม่พบ docker compose (ต้องเป็น Compose v2)"

if [ ! -f .env ]; then
  bad "ไม่มีไฟล์ .env  →  cp .env.example .env แล้วแก้ค่า"
  exit 1
fi

# Value of KEY in .env, without quotes.
get() { sed -n "s/^$1=//p" .env | head -n 1 | sed 's/^"//; s/"$//'; }

pw=$(get POSTGRES_PASSWORD)
if [ -z "$pw" ] || [ "$pw" = "change-me" ]; then
  bad "POSTGRES_PASSWORD ยังไม่ได้ตั้ง (ห้ามเป็น change-me)"
elif [ "${#pw}" -lt 12 ]; then
  bad "POSTGRES_PASSWORD สั้นเกินไป (อย่างน้อย 12 ตัว)"
elif printf '%s' "$pw" | grep -q '[^A-Za-z0-9]'; then
  bad "POSTGRES_PASSWORD ใช้เฉพาะตัวอักษรและตัวเลข (อักขระพิเศษทำให้ DATABASE_URL พัง)"
else
  ok "POSTGRES_PASSWORD ตั้งแล้ว"
fi

secret=$(get AUTH_SECRET)
if [ -z "$secret" ] || [ "$secret" = "change-me" ]; then
  bad "AUTH_SECRET ยังไม่ได้ตั้ง  →  openssl rand -base64 32"
elif [ "${#secret}" -lt 32 ]; then
  bad "AUTH_SECRET สั้นเกินไป (อย่างน้อย 32 ตัว)  →  openssl rand -base64 32"
else
  ok "AUTH_SECRET ตั้งแล้ว"
fi

token=$(get TUNNEL_TOKEN)
if [ -n "$token" ]; then
  ok "มี TUNNEL_TOKEN จะเริ่ม tunnel ด้วย"
  [ "$(get APP_BIND)" = "127.0.0.1" ] && ok "APP_BIND=127.0.0.1 ในบ้านเข้าทาง IP:3000 ไม่ได้ เข้าได้ทาง tunnel เท่านั้น"
fi

# The file holds the database password and the session secret.
if perms=$(stat -c %a .env 2>/dev/null) && [ "$perms" != "600" ] && [ "$perms" != "640" ]; then
  warn ".env เปิดอ่านได้กว้างเกินไป ($perms)  →  chmod 600 .env"
fi

backups=$(get BACKUP_DIR)
backups=${backups:-./backups}
mkdir -p "$backups" 2>/dev/null && [ -w "$backups" ] && ok "เขียนโฟลเดอร์สำรองข้อมูลได้ ($backups)" || bad "เขียนโฟลเดอร์สำรองข้อมูลไม่ได้ ($backups)"

if [ "$fail" -ne 0 ]; then
  echo
  echo "แก้รายการ ✗ ข้างบนก่อน แล้วรันใหม่"
  exit 1
fi
echo
echo "พร้อม deploy"
