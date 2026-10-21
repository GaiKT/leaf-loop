# Leaf Loop

เว็บแอป (mobile-first) วางแผนการเพาะ ย้ายปลูก และเก็บเกี่ยวผักไฮโดรโปนิกส์ NFT ให้ได้ผลผลิตต่อเนื่องทุกสัปดาห์
คำศัพท์ที่ใช้ในแอปอยู่ใน [CONTEXT.md](CONTEXT.md) ข้อกำหนดอยู่ใน [docs/prd](docs/prd) และงานที่แตกไว้อยู่ใน [docs/issues](docs/issues)

แอปนี้ออกแบบให้ใช้ **ภายในเครือข่ายของฟาร์มเท่านั้น** (WiFi เดียวกับ home server) ไม่ได้เปิดให้เข้าจากอินเทอร์เน็ต

## ส่วนประกอบ

`docker compose` รัน 4 ส่วน:

| service | หน้าที่ |
|---|---|
| `db` | PostgreSQL เก็บข้อมูลทั้งหมด ไม่เปิดพอร์ตออกนอก Docker |
| `migrate` | อัปเดตโครงสร้างฐานข้อมูลให้ตรงกับเวอร์ชันของแอป แล้วหยุด รันทุกครั้งก่อนแอปเริ่ม |
| `app` | ตัวแอป เปิดที่พอร์ต `APP_PORT` (ค่าเริ่มต้น 3000) |
| `backup` | สำรองฐานข้อมูลวันละครั้งลงโฟลเดอร์ `backups/` |

## ติดตั้งบน home server (ครั้งแรก)

ต้องมี Docker และ Docker Compose บนเครื่อง server

1. คัดลอกทั้งโฟลเดอร์โปรเจกต์ไปไว้บน server
2. สร้างไฟล์ `.env` จากตัวอย่าง แล้วแก้ค่า:
   ```bash
   cp .env.example .env
   openssl rand -base64 32   # เอาไปใส่ AUTH_SECRET
   ```
   - `POSTGRES_PASSWORD` ตั้งรหัสผ่านฐานข้อมูลเอง (ใช้ตัวอักษรและตัวเลข)
   - `AUTH_SECRET` ค่าสุ่มจากคำสั่งด้านบน
   - `DATABASE_URL` ในไฟล์ตัวอย่างใช้เฉพาะตอนพัฒนาในเครื่อง บน server ไม่ต้องแก้ เพราะ `compose.yaml` ตั้งให้เอง
3. เริ่มระบบ:
   ```bash
   docker compose up -d --build
   ```
4. เปิดเบราว์เซอร์ในมือถือที่ต่อ WiFi ฟาร์ม ไปที่ `http://<IP ของ server>:3000` ครั้งแรกจะเข้าหน้า **ตั้งค่าเริ่มต้น** ให้สร้างฟาร์มและบัญชีแรก หน้านี้ใช้ได้ครั้งเดียว
5. บนมือถือ เลือก "เพิ่มไปยังหน้าจอหลัก" เพื่อสร้างทางลัด (เป็น HTTP ธรรมดา Android อาจได้แค่ทางลัด ไม่ใช่การติดตั้งแบบเต็ม)

ระบบเริ่มเองเมื่อเครื่อง server รีบูต (`restart: unless-stopped`)

### ทำให้ที่อยู่คงที่

มือถือต้องเปิดที่อยู่เดิมได้ทุกวัน ตั้งใน router ให้ server ได้ IP เดิมเสมอ (DHCP reservation / Static lease) แล้วใช้ IP นั้น หรือใช้ชื่อเครื่อง (เช่น `http://farm-server:3000`) ถ้า router รองรับ

### ความปลอดภัย

- **อย่า port forward** พอร์ตของแอปหรือฐานข้อมูลที่ router แอปนี้ไม่มีระบบกันเดารหัสและไม่ใช้ HTTPS
- ตรวจว่าเข้าจากข้างนอกไม่ได้: ปิด WiFi บนมือถือ (ใช้ 4G/5G) แล้วลองเปิด `http://<IP สาธารณะของบ้าน>:3000` ต้องเข้าไม่ได้
- ถ้าวันหนึ่งต้องเปิดให้เข้าจากข้างนอก ต้องเพิ่ม HTTPS (เช่น Caddy หรือ Cloudflare Tunnel) และระบบล็อกบัญชีเมื่อใส่รหัสผิดหลายครั้งก่อน

## อัปเดตแอป

คัดลอกโค้ดเวอร์ชันใหม่ทับโฟลเดอร์เดิม (ไม่ต้องแตะ `.env` และโฟลเดอร์ `backups/`) แล้ว:

```bash
docker compose up -d --build
```

`migrate` จะอัปเดตฐานข้อมูลให้เอง ข้อมูลเดิมอยู่ใน volume `dbdata` ไม่หายเมื่อสร้าง container ใหม่ (ห้ามใช้ `docker compose down -v` เพราะ `-v` ลบข้อมูลทั้งหมด)

## สำรองและกู้ข้อมูล

`backup` สร้างไฟล์ `backups/hydro-YYYY-MM-DD-HHMMSS.dump` วันละครั้ง และเก็บ 14 วันล่าสุด (ปรับได้ด้วย `BACKUP_KEEP_DAYS` ใน `.env`) ไฟล์ไม่เขียนทับกัน ถ้าเปิดระบบใหม่หลังข้อมูลหาย จะได้ไฟล์ใหม่ที่ว่างเพิ่มมา **ไฟล์เก่าที่ดียังอยู่** เลือกไฟล์ที่ใหญ่และใหม่ที่สุดก่อนที่ข้อมูลจะหาย

**สำรองเดี๋ยวนี้ (ไม่รอรอบวัน):**
```bash
docker compose exec -T db pg_dump -U hydro --format=custom hydro > backups/manual-$(date +%F-%H%M%S).dump
```

**กู้ข้อมูล** (ทำบน server ที่เป็น Linux หรือใน Git Bash ห้ามใช้ PowerShell เพราะมันทำลายไฟล์ binary ตอน redirect):
```bash
docker compose stop app backup
docker compose exec -T db pg_restore -U hydro -d hydro --clean --if-exists --no-owner < backups/<ชื่อไฟล์>.dump
docker compose start app backup
```

ควรคัดลอกโฟลเดอร์ `backups/` ไปเก็บอีกเครื่องหรือ USB drive เป็นระยะ ถ้าดิสก์ของ server เสีย ไฟล์สำรองที่อยู่ในเครื่องเดียวกันจะเสียไปด้วย

## ลืมรหัสผ่าน

Grower คนอื่นกด "รีเซ็ตรหัสผ่าน" ให้ได้ที่ ตั้งค่า › ผู้ใช้งาน ถ้าทุกคนเข้าไม่ได้ ให้รีเซ็ตจาก server:

```bash
docker compose run --rm migrate npx tsx scripts/reset-password.mts <ชื่อผู้ใช้>
```

คำสั่งจะพิมพ์รหัสผ่านชั่วคราว เจ้าของบัญชีต้องตั้งรหัสใหม่ตอนเข้าสู่ระบบครั้งถัดไป

## พัฒนาในเครื่อง

```bash
cp .env.example .env                                              # แก้ค่าตามต้องการ
docker compose -f compose.yaml -f compose.dev.yaml up -d db       # เปิดเฉพาะฐานข้อมูล (พอร์ต 5432 เฉพาะ localhost)
npm install
npx prisma migrate dev
npm run dev
```

- `npm run seed` **ลบข้อมูลทั้งหมด** แล้วใส่ข้อมูลตัวอย่าง (โต๊ะ 5 ใบ, กรีนโอ๊ค 5 กก./สัปดาห์, รุ่นที่อยู่คนละขั้นตอน) ผู้ใช้คือ `DEV_TEST_USERNAME` / `DEV_TEST_PASSWORD` ใน `.env` สคริปต์ไม่ยอมรันกับฐานข้อมูลที่ไม่ใช่เครื่องนี้ ห้ามใช้บน server จริง
- `npm test` รัน unit test (ตรรกะการวางแผนอยู่ใน `src/lib/schedule.ts` เป็น pure function)
- หลังแก้ `prisma/schema.prisma` ต้องรัน `npx prisma migrate dev` และ `npx prisma generate` แล้ว **restart `npm run dev`** ไม่เช่นนั้น dev server จะใช้ Prisma client เก่า
- เปิดแอปครั้งแรกจะเข้าหน้าตั้งค่าเริ่มต้น `DEV_TEST_USERNAME` / `DEV_TEST_PASSWORD` ใน `.env` เป็นแค่ที่เก็บบัญชีทดสอบของเครื่อง dev ไม่ได้ถูกใช้โดยแอป
