# MediFlow Server — Backend 1 (Raihan)

Core API: auth, direktori dokter, booking, antrean realtime Socket.IO.

## Setup

1. Install dependensi: `npm install`
2. Pastikan PostgreSQL jalan. Sesuaikan `config/config.json` (default user/password `postgres`, database `MediFlowDB`). Production memakai `DATABASE_URL` (Supabase).
3. Salin `.env.template` menjadi `.env`.
4. Buat DB + migrasi + seeder (lokal saja — **jangan** `db:create` / `db:reset` di Supabase):

```bash
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

5. Jalankan: `npm start` → `http://localhost:3000`

## Akun demo

Password semua akun seed: **`password123`**

Data master ada di `seeders/data/*.json` (20 poli, 5 dokter per poli, 100 obat). Seeder hanya membaca JSON lalu `bulkInsert`.

| Role | Email | Nama |
| --- | --- | --- |
| Admin | `admin@mediflow.test` | Admin MediFlow |
| Dokter Umum | `dokter.umum@mediflow.test` | dr. Budi Santoso |
| Dokter Gigi | `dokter.gigi@mediflow.test` | drg. Sari Putri |
| Dokter Anak | `dokter.anak@mediflow.test` | dr. Andi Wijaya |
| Pasien | `pasien@mediflow.test` | Andi Saputra |

Dokter lain: `dokter.{poli}{nomor}@mediflow.test` (contoh `dokter.jantung1@mediflow.test`). Poli: Umum, Penyakit Dalam, Anak, Gigi, Kandungan, Bedah, Jantung, Saraf, Mata, THT, Kulit, Paru, Orthopedi, Jiwa, Urologi, Rehabilitasi Medik, Gizi Klinik, Onkologi, Nefrologi, Endokrin.

Jadwal per poli **1 dokter per sesi**, bergiliran:

Senin pagi → dokter 1, Senin siang → dokter 2, Selasa pagi → dokter 3, Selasa siang → dokter 4, Rabu pagi → dokter 5, Rabu siang → dokter 1, dan seterusnya sampai Sabtu.

Contoh poli Umum:

| Hari | Pagi (08:00–12:00) | Siang (13:00–17:00) |
| --- | --- | --- |
| Senin | Dokter 1 | Dokter 2 |
| Selasa | Dokter 3 | Dokter 4 |
| Rabu | Dokter 5 | Dokter 1 |
| Kamis | Dokter 2 | Dokter 3 |
| Jumat | Dokter 4 | Dokter 5 |
| Sabtu | Dokter 1 | Dokter 2 |

Kuota pagi 10, siang 8. `dayOfWeek`: 0 = Minggu … 6 = Sabtu. Pola sama di semua poli (`doctors.json`).

Setelah mengubah JSON, seed ulang: `npm run db:reset`.

Kontrak lengkap REST + Socket.IO: [API.md](../API.md) (selaras PRD v1.4).

Ringkasan cepat di bawah. Auth header (kecuali publik): `Authorization: Bearer <jwt>`. Error: `{ "error": "pesan indonesia" }`.

### Publik
- `POST /api/auth/register` `{ name, email, password, phone }`
- `POST /api/auth/login` `{ email, password }` → `{ accessToken, user: { id, name, email, role } }`
- `GET /api/specialties`
- `GET /api/specialties/:id` (kalender 14 hari: tanggal, sesi pagi/siang, dokter, sisa kuota)
- `GET /api/doctors?specialtyId=&name=`
- `GET /api/doctors/:id` (jadwal + `upcomingSessions.remainingQuota`)

### Login
- `GET /api/me`
- `PATCH /api/me` `{ name, phone, password? }` — nama dan HP; password opsional (min. 6). Email dan role tidak diubah.

### Patient
- `POST /api/appointments` `{ doctorId, date, session: "morning"|"afternoon" }`
- `GET /api/appointments`
- `GET /api/appointments/:id`
- `PATCH /api/appointments/:id/cancel`
- `GET /api/queues/:doctorId?date=YYYY-MM-DD&session=morning|afternoon`

### Doctor
- `GET /api/doctor/sessions/today`
- `POST /api/doctor/sessions/open` `{ date, session }`
- `GET /api/doctor/queues?date=&session=`
- `POST /api/doctor/queues/call` `{ date, session }`
- `POST /api/doctor/queues/skip` `{ appointmentId }`
- `POST /api/doctor/consultations/start` `{ appointmentId }`

### Admin
- CRUD `/api/admin/specialties`
- CRUD `/api/admin/doctors` (create = User role doctor + row Doctor)
- CRUD `/api/admin/schedules`
- `GET /api/admin/appointments?status=&date=&doctorId=`
- `POST /api/admin/uploads` multipart `file` + `folder` (`doctors`|`specialties`|`medicines`) → `{ url }` (ImageKit)

## Socket.IO

Satu server, JWT di `handshake.auth.token` (atau header `Authorization`).

Join: `socket.emit("join", "queue:{doctorId}:{YYYY-MM-DD}:{morning|afternoon}", ack)`
atau `socket.emit("join", "chat:{appointmentId}", ack)`

Event antrean:
- `queue:updated` `{ doctorId, date, session, nowServing, items: [{ queueNumber, patientNameMasked, status }], updatedAt }`
- `queue:called` `{ doctorId, date, session, queueNumber, appointmentId, calledAt }`
- `queue:completed` `{ doctorId, date, session, queueNumber, appointmentId }`

Typing (client): `socket.emit("chat:typing", { appointmentId, isTyping })`

Helper untuk Salsa (`sockets/emit.js`):
`emitQueueUpdated`, `emitQueueCalled`, `emitQueueCompleted`,
`emitChatMessage`, `emitChatTyping`, `emitChatRead`

Dashboard counts (Salsa boleh import): `helpers/dashboardCounts.js` → `getDashboardCounts()`.

## Deploy API ke EC2 (Supabase)

Frontend Vercel adalah HTTPS. API di EC2 harus **HTTPS** juga (domain + nginx + Certbot). Kalau API hanya `http://IP:3000`, browser akan memblokir request dari Vercel (mixed content).

Jangan commit `.env`. Karakter `!` di password URI harus di-encode `%21`. Pakai **session pooler port 5432**, bukan 6543.

### 1. Instance

- Ubuntu 22.04/24.04, Elastic IP.
- Security group inbound: **22** (SSH), **80**, **443**. Port 3000 tidak perlu publik jika nginx di instance yang sama.

### 2. Software

```bash
sudo apt update
sudo apt install -y git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### 3. Kode + env

```bash
git clone https://github.com/MediFlow-Project/MediFlow.git
cd MediFlow/Server
npm install
cp .env.template .env
nano .env
```

Isi `.env` (ganti URL Vercel dan secret):

```
NODE_ENV=production
PORT=3000
SECRET_KEY=<string-acak-panjang>
DATABASE_URL=postgresql://USER:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require
CLIENT_URL=https://<project>.vercel.app
GOOGLE_CLIENT_ID=
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

### 4. Migrasi + seed (sekali)

Jangan `db:create` atau `db:reset` — database `postgres` di Supabase sudah ada.

```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### 5. Proses Node

```bash
pm2 start server.js --name mediflow-api
pm2 save
pm2 startup
```

Cek lokal di instance: `curl http://127.0.0.1:3000/api/health` → `{"ok":true}`.

### 6. HTTPS (wajib untuk Vercel)

DNS A record domain (contoh `api.domainkamu.com`) → Elastic IP. Lalu:

```bash
sudo nano /etc/nginx/sites-available/mediflow
```

```
server {
  listen 80;
  server_name api.domainkamu.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mediflow /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.domainkamu.com
```

### 7. Vercel (setelah API HTTPS hidup)

- `VITE_API_URL` = `https://api.domainkamu.com/api`
- `VITE_SOCKET_URL` = `https://api.domainkamu.com`

Redeploy frontend. Set `CLIENT_URL` di `.env` server ke URL Vercel, lalu `pm2 restart mediflow-api`. Tambah origin Vercel di Google Cloud OAuth. Webhook Midtrans: `https://api.domainkamu.com/api/payments/midtrans/notification`.

## Demo Panggil (checkpoint)

1. Login pasien, `POST /api/appointments` ke dokter gigi, tanggal hari ini, `morning`.
2. Login dokter gigi, `POST /api/doctor/sessions/open`.
3. Dua client Socket.IO join room `queue:{doctorId}:{date}:morning`.
4. Dokter `POST /api/doctor/queues/call` — kedua client terima `queue:called` tanpa refresh.
