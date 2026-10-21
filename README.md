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
| `tunnel` | (ไม่บังคับ) Cloudflare Tunnel สำหรับใช้จากนอกบ้าน เริ่มด้วย `--profile tunnel` |

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

- **อย่า port forward** พอร์ตของแอปหรือฐานข้อมูลที่ router ถ้าอยากใช้จากนอกบ้าน ใช้วิธีใน [ใช้จากนอกบ้าน](#ใช้จากนอกบ้านอย่างปลอดภัย) แทน
- ตรวจว่าเข้าจากข้างนอกไม่ได้: ปิด WiFi บนมือถือ (ใช้ 4G/5G) แล้วลองเปิด `http://<IP สาธารณะของบ้าน>:3000` ต้องเข้าไม่ได้
- ระบบล็อกบัญชีอัตโนมัติ: ใส่รหัสผิด 8 ครั้งใน 15 นาที (นับแยกตามเครื่องที่เข้า และตามชื่อผู้ใช้) จะถูกล็อก 15 นาที ปลดเองเมื่อครบเวลา หรือปลดทันทีด้วย
  ```bash
  docker compose exec db psql -U hydro -d hydro -c 'DELETE FROM "LoginAttempt"'
  ```
  ข้อควรรู้: คนที่รู้ชื่อผู้ใช้สามารถทำให้บัญชีนั้นเข้าไม่ได้ 15 นาทีด้วยการลองผิด 8 ครั้ง นี่คือราคาของการกันเดารหัส (ตั้งรหัสผ่านยาว ๆ ไว้เสมอ)

## ใช้จากนอกบ้านอย่างปลอดภัย

หลักการ: **แอปและฐานข้อมูลอยู่ที่ home server ตามเดิม** ไม่เปิดพอร์ตที่ router เลย ให้ตัว tunnel ที่รันบน server ต่อออกไปหา Cloudflare เอง ฐานข้อมูลไม่เคยโผล่ออกอินเทอร์เน็ต

### ทางเลือก A: Cloudflare Tunnel (ต้องมีโดเมนที่ใช้ Cloudflare จัดการ DNS)

ได้ที่อยู่ HTTPS เช่น `https://leaf.โดเมนของคุณ` เปิดจากมือถือที่ไหนก็ได้

1. เข้า Cloudflare → Zero Trust → Networks → Tunnels → Create a tunnel (เลือก Cloudflared) ตั้งชื่ออะไรก็ได้ แล้วคัดลอก **token**
2. ในหน้า tunnel เพิ่ม Public hostname: ชื่อ `leaf.โดเมนของคุณ`, Service เป็น `HTTP` และ URL `app:3000`
3. ใส่ในไฟล์ `.env`:
   ```
   TUNNEL_TOKEN=<token ที่คัดลอกมา>
   ```
4. เริ่ม tunnel:
   ```bash
   docker compose --profile tunnel up -d
   ```
5. **แนะนำมาก**: ใส่ด่านที่สองหน้าแอปด้วย Cloudflare Access (Zero Trust → Access → Applications → Add → Self-hosted ชื่อโดเมนเดียวกัน แล้วตั้ง policy ให้เฉพาะอีเมลของคนในฟาร์มเข้าได้) คนแปลกหน้าจะไปไม่ถึงหน้า login ของแอปเลย
6. ถ้าไม่ต้องการให้เข้าทาง `http://<IP>:3000` ในบ้านอีก ใส่ `APP_BIND=127.0.0.1` ใน `.env` แล้ว `docker compose up -d`

ข้อมูลที่ต้องรู้: ผ่านทาง Cloudflare ทุกคำขอไปทางบริษัทนั้นก่อน ถึงจะเข้ารหัสถึงเบราว์เซอร์ แต่ Cloudflare เห็นเนื้อหาได้ในทางเทคนิค ถ้ายอมรับไม่ได้ ใช้ทางเลือก B

### ทางเลือก B: Tailscale (ไม่ต้องมีโดเมน ไม่เปิดสู่สาธารณะเลย)

ติดตั้งแอป Tailscale บน server และบนมือถือทุกเครื่อง ล็อกอินบัญชีเดียวกัน แล้วเปิด `http://<ชื่อเครื่อง server ใน Tailscale>:3000` ได้จากทุกที่ คนนอกวงเปิดไม่ได้ ปลอดภัยกว่าทางเลือก A แต่ต้องติดตั้งแอปบนทุกเครื่อง

### เช็กลิสต์ก่อนใช้จริงนอกบ้าน

- ตั้งรหัสผ่านทุกบัญชีให้ยาวและไม่ซ้ำกับที่อื่น
- มี Cloudflare Access (ทางเลือก A) หรือใช้ Tailscale (ทางเลือก B)
- ตรวจว่า router ไม่มีการ port forward ใด ๆ ไปที่ server
- สำรองข้อมูลตามหัวข้อด้านล่าง และก๊อปปี้ `backups/` ไปเก็บอีกที่

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
