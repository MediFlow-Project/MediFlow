# MediFlow Server — Backend 1 (Raihan)

Core API: auth, direktori dokter, booking, antrean realtime Socket.IO.

## Setup

1. Install dependensi: `npm install`
2. Pastikan PostgreSQL jalan. Sesuaikan `config/config.json` (default user/password `postgres`, database `MediFlowDB`).
3. Salin `.env.template` menjadi `.env`.
4. Buat DB + migrasi + seeder:

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

## Endpoint (Raihan)

Auth header (kecuali publik): `Authorization: Bearer <jwt>`

Error: `{ "error": "pesan indonesia" }`

### Publik
- `POST /api/auth/register` `{ name, email, password, phone }`
- `POST /api/auth/login` `{ email, password }` → `{ accessToken, user: { id, name, email, role } }`
- `GET /api/specialties`
- `GET /api/specialties/:id` (kalender 14 hari: tanggal, sesi pagi/siang, dokter, sisa kuota)
- `GET /api/doctors?specialtyId=&name=`
- `GET /api/doctors/:id` (jadwal + `upcomingSessions.remainingQuota`)

### Login
- `GET /api/me`

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

## Demo Panggil (checkpoint)

1. Login pasien, `POST /api/appointments` ke dokter gigi, tanggal hari ini, `morning`.
2. Login dokter gigi, `POST /api/doctor/sessions/open`.
3. Dua client Socket.IO join room `queue:{doctorId}:{date}:morning`.
4. Dokter `POST /api/doctor/queues/call` — kedua client terima `queue:called` tanpa refresh.
