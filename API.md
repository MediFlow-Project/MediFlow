# MediFlow API

REST + Socket.IO untuk RS MediFlow. Prefix REST: `/api`. Base URL lokal: `http://localhost:3000`.

Selaras dengan [PRD.md](./PRD.md) v1.4. Setup server: [Server/README.md](./Server/README.md).

---

## Isi

1. [Konvensi](#konvensi)
2. [Enum](#enum)
3. [Auth](#auth)
4. [Profil](#profil)
5. [Direktori publik](#direktori-publik)
6. [Janji temu](#janji-temu)
7. [Antrean](#antrean)
8. [Praktik dokter](#praktik-dokter)
9. [Chat](#chat)
10. [Notifikasi](#notifikasi)
11. [Chatbot](#chatbot)
12. [Tagihan & pembayaran](#tagihan--pembayaran)
13. [Admin](#admin)
14. [Socket.IO](#socketio)
15. [Error](#error)
16. [Akun demo](#akun-demo)

---

## Konvensi

| | |
| --- | --- |
| Format | JSON (`Content-Type: application/json`) kecuali upload foto (multipart) |
| Auth | Header `Authorization: Bearer <accessToken>` kecuali endpoint bertanda **publik** |
| Tanggal | `YYYY-MM-DD` |
| Sesi | `morning` \| `afternoon` |
| Error | `{ "error": "pesan indonesia" }` |
| JWT | Payload `{ userId, role }`, expiry default `7d` (`JWT_EXPIRES_IN`) |
| CORS | Aktif untuk semua origin (demo) |

Role: `patient` | `doctor` | `admin`. Register hanya membuat pasien. Dokter dan admin dari seeder (atau CRUD admin).

---

## Enum

**Appointment `status`:** `booked` → `waiting` → `called` → `in_consultation` → `completed` plus `cancelled`, `no_show`.

**Invoice `status`:** `unpaid` → `pending` → `paid` | `expire` | `failed`.

**Chat writable:** hanya `completed`. GET riwayat boleh untuk peserta. POST pesan 409 sebelum selesai konsul, serta pada `cancelled` / `no_show`. Tidak ada batas H+1.

**Notifikasi `type`:** `queue_called`, `queue_skipped`, `session_opened`, `appointment_cancelled`, `booking_created`, `invoice_created`, `invoice_paid`, `invoice_failed`, `invoice_expired`.

---

## Auth

### `POST /api/auth/register` — publik

Membuat pasien. **201** `{ id, name, email, phone, role }` (`role` selalu `patient`). Tidak mengembalikan token — lanjut login.

Body:

```json
{ "name": "Andi Saputra", "email": "andi@mail.com", "password": "password123", "phone": "081234567890" }
```

| Status | Kapan |
| --- | --- |
| 400 | Nama/email/password/HP kosong; password < 6 karakter |
| 409 | Email sudah terdaftar |

### `POST /api/auth/login` — publik

```json
{ "email": "pasien@mediflow.test", "password": "password123" }
```

**200**

```json
{
  "accessToken": "<jwt>",
  "user": { "id": 1, "name": "Andi Saputra", "email": "pasien@mediflow.test", "role": "patient" }
}
```

| Status | Kapan |
| --- | --- |
| 400 | Email atau password kosong |
| 401 | Kredensial salah |

### `POST /api/auth/google` — publik

Body `{ "idToken": "<Google ID token>" }`. Jika email belum ada, akun pasien baru dibuat (HP `null` — lengkapi di `PATCH /me`). Dokter/admin seed tidak diubah rolenya.

**200** sama seperti login. **400** token kosong. **401** token Google tidak valid. **500** `GOOGLE_CLIENT_ID` belum di env.

---

## Profil

Semua role yang sudah login.

### `GET /api/me`

**200** `{ id, name, email, phone, role, doctor? }`. Field `doctor` hanya untuk role dokter:

```json
{
  "id": 4,
  "name": "drg. Sari Putri",
  "email": "dokter.gigi@mediflow.test",
  "phone": "0811…",
  "role": "doctor",
  "doctor": {
    "id": 2,
    "specialtyId": 4,
    "consultationFee": 150000,
    "bio": "…",
    "imgUrl": "https://…"
  }
}
```

### `PATCH /api/me`

Body opsional: `{ "name", "phone", "password" }`. Email dan role tidak diubah. Password jika diisi minimal 6 karakter. **200** sama seperti `GET /me`.

---

## Direktori publik

Tanpa token.

### `GET /api/specialties`

Array `{ id, name, description, imgUrl, doctorCount }`.

### `GET /api/specialties/:id`

Detail poli + dokter + kalender 14 hari (hanya tanggal yang ada sesi).

```json
{
  "id": 4,
  "name": "Gigi",
  "description": "…",
  "imgUrl": "https://…",
  "doctors": [
    { "id": 2, "name": "drg. Sari Putri", "consultationFee": 150000, "bio": "…", "imgUrl": "https://…" }
  ],
  "calendar": [
    {
      "date": "2026-08-21",
      "dayOfWeek": 5,
      "sessions": {
        "morning": {
          "doctorId": 2,
          "doctorName": "drg. Sari Putri",
          "imgUrl": "https://…",
          "consultationFee": 150000,
          "startTime": "08:00",
          "endTime": "12:00",
          "quota": 10,
          "remainingQuota": 9
        },
        "afternoon": null
      }
    }
  ]
}
```

**404** spesialisasi tidak ditemukan. `dayOfWeek`: 0 = Minggu … 6 = Sabtu.

### `GET /api/doctors?specialtyId=&name=`

Query opsional. `name` filter `ILIKE` nama dokter. Array `{ id, name, bio, consultationFee, imgUrl, specialty: { id, name } }`.

### `GET /api/doctors/:id`

Profil + jadwal mingguan + `upcomingSessions` 14 hari (`date`, `session`, `dayOfWeek`, `startTime`, `endTime`, `quota`, `remainingQuota`). **404** dokter tidak ditemukan.

---

## Janji temu

### `POST /api/appointments` — pasien

```json
{ "doctorId": 2, "date": "2026-08-21", "session": "morning" }
```

**201** objek appointment (lihat di bawah). Status `booked`, atau `waiting` jika dokter sudah buka sesi itu. Nomor antrean = urutan booking.

| Status | Kapan |
| --- | --- |
| 400 | Field wajib; tanggal bukan `YYYY-MM-DD`; sesi tidak valid; tanggal lampau; tidak ada jadwal hari itu |
| 403 | Bukan pasien |
| 404 | Dokter tidak ada |
| 409 | Kuota penuh; double-book dokter yang sama pada tanggal+sesi (status aktif, bukan `cancelled`/`no_show`) |

### `GET /api/appointments` — pasien / dokter / admin

Pasien: milik sendiri. Dokter: sesinya. Admin: semua. Array appointment, urut tanggal DESC.

### `GET /api/appointments/:id` — peserta / admin

**403** jika bukan pemilik, bukan dokter sesi, dan bukan admin. **404** tidak ada.

Bentuk appointment:

```json
{
  "id": 12,
  "patientId": 5,
  "doctorId": 2,
  "date": "2026-08-21",
  "session": "morning",
  "queueNumber": 3,
  "status": "booked",
  "doctor": {
    "id": 2,
    "name": "drg. Sari Putri",
    "consultationFee": 150000,
    "bio": "…",
    "imgUrl": "https://…",
    "specialty": { "id": 4, "name": "Gigi" }
  },
  "patient": { "id": 5, "name": "Andi Saputra" },
  "consultation": null,
  "invoice": null
}
```

Setelah konsul selesai, `consultation` berisi keluhan/diagnosa/catatan + `items[]` (nama, harga, qty, dosis, subtotal) dan `invoice` `{ id, amount, status, consultationFee, medicineTotal }`.

### `PATCH /api/appointments/:id/cancel` — pasien (pemilik)

Hanya `booked` atau `waiting`. Setelah `called` ditolak. **200** appointment dengan `status: "cancelled"`. Chat menjadi read-only.

**403** bukan pemilik. **409** sudah tidak boleh dibatalkan.

---

## Antrean

Hydrate REST dulu, lalu join room socket. `nowServing` = nomor yang `called` atau `in_consultation`, atau `null`.

Board:

```json
{
  "doctorId": 2,
  "date": "2026-08-21",
  "session": "morning",
  "nowServing": 1,
  "items": [
    {
      "queueNumber": 1,
      "patientNameMasked": "Andi S.",
      "status": "called",
      "appointmentId": 12
    }
  ],
  "updatedAt": "2026-08-21T01:00:00.000Z"
}
```

`appointmentId` ada di REST hydrate. Event socket `queue:updated` **tidak** menyertakan `appointmentId`.

### `GET /api/queues/:doctorId?date=&session=` — login

Pasien hanya jika punya janji sesi itu. Dokter hanya sesinya. Admin boleh. Query `date` dan `session` wajib.

---

## Praktik dokter

Semua butuh role `doctor` + baris `Doctor` terhubung ke user. **403** jika profil dokter tidak ada.

### `GET /api/doctor/sessions/today`

Array sesi hari ini:

```json
[
  {
    "date": "2026-08-21",
    "session": "morning",
    "startTime": "08:00",
    "endTime": "12:00",
    "quota": 10,
    "remainingQuota": 7,
    "bookedCount": 2,
    "waitingCount": 1,
    "calledCount": 0,
    "isOpen": false
  }
]
```

### `POST /api/doctor/sessions/open`

Body `{ "date", "session" }`. Appointment `booked` → `waiting`. Emit `queue:updated`. **200** board (dengan `appointmentId`).

### `GET /api/doctor/queues?date=&session=`

Board sesi dokter yang login (dengan `appointmentId`).

### `POST /api/doctor/queues/call`

Body `{ "date", "session" }`. Memanggil `waiting` dengan nomor terkecil. Satu pasien `called`/`in_consultation` per sesi.

**200** `{ appointmentId, queueNumber, status: "called", calledAt }`. **409** antrean kosong atau masih ada pasien aktif.

### `POST /api/doctor/queues/skip`

Body `{ "appointmentId" }`. Status `waiting` atau `called` → `no_show`. **200** `{ appointmentId, queueNumber, status: "no_show" }`.

### `POST /api/doctor/consultations/start`

Body `{ "appointmentId" }`. Hanya dari `called` → `in_consultation`. **200** `{ appointmentId, queueNumber, status }`.

### `POST /api/doctor/consultations/complete`

Hanya dari `in_consultation`. Membuat consultation, item resep, invoice `unpaid`. Chat menjadi writable. **201**

```json
{
  "appointmentId": 12,
  "queueNumber": 3,
  "status": "completed",
  "consultation": {
    "id": 8,
    "complaint": "Sakit geraham",
    "diagnosis": "Karies",
    "notes": "",
    "items": [{ "id": 1, "medicineId": 3, "quantity": 2, "dosage": "3x1 sesudah makan" }]
  },
  "invoice": { "id": 8, "amount": 160000, "status": "unpaid" }
}
```

Body:

```json
{
  "appointmentId": 12,
  "complaint": "Sakit geraham",
  "diagnosis": "Karies",
  "notes": "",
  "items": [{ "medicineId": 3, "quantity": 2, "dosage": "3x1 sesudah makan" }]
}
```

`items` opsional (boleh `[]`). Tiap item: `medicineId` integer, `quantity` ≥ 1, `dosage` tidak kosong. **amount** = `consultationFee + Σ(price × qty)`.

**409** status bukan `in_consultation`, atau konsul sudah ada.

Katalog obat untuk form: `GET /api/admin/medicines` (dokter boleh baca).

---

## Chat

Peserta: pasien pemilik appointment dan dokter pemilik. Admin **403**. Kirim pesan lewat REST, bukan emit dari client.

### `GET /api/chats` — pasien / dokter

Inbox semua appointment user (termasuk yang belum ada pesan). Array:

```json
{
  "appointmentId": 12,
  "counterpartName": "drg. Sari Putri",
  "counterpartImgUrl": "https://…",
  "status": "completed",
  "lastMessage": { "id": 10, "senderId": 5, "body": "Dok, dosisnya…", "createdAt": "…" },
  "unreadCount": 1,
  "date": "2026-08-21",
  "session": "morning",
  "writable": true
}
```

`unreadCount` memakai `lastReadMessageId` (cadangan `lastReadAt`). `writable` true hanya jika `completed`.

### `GET /api/appointments/:id/messages`

**200**

```json
{
  "messages": [
    {
      "id": 10,
      "appointmentId": 12,
      "senderId": 5,
      "senderRole": "patient",
      "body": "Dok, dosis paracetamol setelah makan ya?",
      "createdAt": "2026-08-21T04:01:00.000Z",
      "read": true
    }
  ],
  "counterpartLastReadAt": "2026-08-21T04:02:00.000Z",
  "counterpartLastReadMessageId": 10
}
```

`read` pada pesan = id ≤ `counterpartLastReadMessageId`.

### `POST /api/appointments/:id/messages`

Body `{ "body": "…" }` (trim, 1–1000 karakter, tanpa HTML). **201** objek pesan (`read: false`). Server emit `chat:message`.

**409** thread read-only. **400** kosong atau terlalu panjang.

### `POST /api/appointments/:id/messages/read`

Set `lastReadAt` dan `lastReadMessageId`. Emit `chat:read`. **200** `{ appointmentId, userId, lastReadAt, lastReadMessageId }`.

---

## Notifikasi

Pasien dan dokter. Maks 50 item terbaru.

### `GET /api/notifications`

```json
{
  "items": [
    {
      "id": 1,
      "userId": 5,
      "type": "queue_called",
      "title": "Giliran Anda",
      "message": "Nomor 03 dipanggil. Silakan ke ruang praktik.",
      "href": "/saya/antrean/12",
      "appointmentId": 12,
      "invoiceId": null,
      "readAt": null,
      "createdAt": "2026-08-21T02:00:00.000Z"
    }
  ],
  "unreadCount": 1
}
```

### `POST /api/notifications/:id/read`

**200** notifikasi dengan `readAt` terisi. **404** bukan milik user.

### `POST /api/notifications/read-all`

**200** `{ "ok": true, "readAt": "…" }`.

---

## Chatbot

### `POST /api/chatbot/recommend` — pasien

Body `{ "message": "gigi berlubang" }` (wajib, max 1000). Gemini, cadangan Groq. Hanya dokter dengan sisa kuota > 0. Tidak persist di server.

**200**

```json
{
  "disclaimer": "Ini bukan pengganti opini medis. …",
  "reply": "…",
  "recommendations": [
    {
      "doctorId": 2,
      "doctorName": "drg. Sari Putri",
      "specialtyName": "Gigi",
      "imgUrl": "https://…",
      "reason": "…",
      "nextSession": { "date": "2026-08-21", "session": "morning" }
    }
  ]
}
```

`recommendations` 0–3 item. Jika tidak ada yang cocok, `recommendations` kosong dan `reply` jujur. **401/403** bukan pasien. **400** keluhan kosong/terlalu panjang. **500** kedua LLM belum dikonfigurasi.

---

## Tagihan & pembayaran

Satu invoice per appointment, dibuat saat complete. `amount` integer (fee konsul + obat).

### `GET /api/invoices?status=` — pasien

Milik sendiri. `status` opsional: `unpaid` | `pending` | `paid` | `expire` | `failed`. Setiap item di-sync ke Midtrans bila ada `midtransOrderId`. Array detail (lihat `GET /:id`).

### `GET /api/invoices/:id` — pasien pemilik / dokter sesi / admin

Sync status Midtrans (cadangan webhook). **200**

```json
{
  "id": 8,
  "appointmentId": 12,
  "amount": 160000,
  "status": "unpaid",
  "midtransOrderId": null,
  "consultationFee": 150000,
  "medicineTotal": 10000,
  "items": [
    {
      "id": 1,
      "medicineId": 3,
      "name": "Paracetamol",
      "imgUrl": "https://…",
      "price": 5000,
      "quantity": 2,
      "dosage": "3x1 sesudah makan",
      "subtotal": 10000
    }
  ],
  "consultation": { "complaint": "…", "diagnosis": "…", "notes": null },
  "date": "2026-08-21",
  "session": "morning",
  "doctor": { "id": 2, "name": "drg. Sari Putri", "imgUrl": "https://…", "specialty": { "id": 4, "name": "Gigi" } },
  "patient": { "id": 5, "name": "Andi Saputra" }
}
```

### `POST /api/invoices/:id/pay` — pasien pemilik

Setiap klik: cancel order lama (abaikan error), buat **order ID baru** `MEDIFLOW-{invoiceId}-{timestamp}` dan Snap token baru. Payload Snap: `gross_amount` integer, `item_details` jumlahnya sama dengan amount, `customer_details` bila valid.

**200** `{ "snapToken": "…", "clientKey": "SB-Mid-client-…" }`

Frontend: `https://app.sandbox.midtrans.com/snap/snap.js` lalu `snap.pay(snapToken)`. Jika QRIS error **2603**, tutup Snap, panggil Pay lagi, pilih Transfer Bank. Jangan scan QR sandbox dengan aplikasi GoPay asli.

**409** sudah `paid`. **500** kunci Midtrans belum di env.

### `POST /api/payments/midtrans/notification` — publik (Midtrans)

Tanpa JWT. Body notifikasi Midtrans. Verifikasi `signature_key` = SHA512(`order_id + status_code + gross_amount + server_key`) **dan** `gross_amount` = `invoice.amount`.

**200** `{ "received": true }` atau `{ "received": true, "ignored": "amount_mismatch" }`. Sudah `paid` diabaikan (idempotent). **403** signature tidak valid.

Lokal: Midtrans tidak bisa POST ke localhost. `GET /invoices/:id` sudah sync Core API.

---

## Admin

Semua `requireAdmin` kecuali catatan di bawah. Foto: multipart field `file` (JPG/PNG/WEBP/GIF, max 5 MB) dan/atau JSON `imgUrl`.

### Dashboard

`GET /api/admin/dashboard` → `{ "bookingsToday": 3, "activeQueues": 1 }`  
`activeQueues` = jumlah `waiting` + `called` + `in_consultation`.

### Upload

`POST /api/admin/uploads` multipart `file` + `folder`: `doctors` | `specialties` | `medicines`. **201** `{ "url": "https://…" }`.

### Spesialisasi — `/api/admin/specialties`

| Method | Path | Body |
| --- | --- | --- |
| GET | `/` | — |
| POST | `/` | `name` wajib, `description`, `file`/`imgUrl` |
| PUT | `/:id` | sama |
| DELETE | `/:id` | **409** jika masih dipakai dokter |

### Dokter — `/api/admin/doctors`

Create = User role `doctor` + baris Doctor.

POST body: `name`, `email`, `password`, `specialtyId`, `consultationFee` wajib; `phone`, `bio`, `file` opsional.

PUT: `name`, `email`, `phone`, `specialtyId`, `consultationFee`, `bio`, `file`. Password tidak diubah di sini.

DELETE **409** jika masih ada janji. Jadwal dokter ikut terhapus.

Response dokter admin: `{ id, userId, name, email, phone, specialtyId, specialty, consultationFee, bio, imgUrl }`.

### Jadwal — `/api/admin/schedules`

Query list: `?doctorId=`. Unique `(doctorId, dayOfWeek, session)`.

POST: `doctorId`, `dayOfWeek` (0–6), `session`, `startTime`, `endTime`, `quota`.

### Obat — `/api/admin/medicines`

`GET /` dan `GET /:id` juga boleh **dokter** (katalog resep). Write admin.

POST/PUT: `name`, `price` (integer ≥ 0), `file`/`imgUrl`. DELETE **200** `{ "message": "Obat berhasil dihapus" }`.

### Monitor

`GET /api/admin/appointments?status=&date=&doctorId=`

`GET /api/admin/invoices?status=&date=` — `date` memfilter tanggal janji.

---

## Socket.IO

Origin sama dengan HTTP (`VITE_SOCKET_URL`, default `http://localhost:3000`). Satu koneksi per client.

Handshake: `auth: { token: accessToken }` atau header `Authorization: Bearer …`. Tanpa token koneksi ditolak.

Saat connect, socket otomatis join `user:{userId}` (notifikasi).

### Client → server

| Emit | Payload | Ack |
| --- | --- | --- |
| `join` | `"queue:{doctorId}:{YYYY-MM-DD}:{morning\|afternoon}"` atau `"chat:{appointmentId}"` | `{ ok: true, room }` atau `{ ok: false, error }` |
| `leave` | nama room yang sama | `{ ok: true }` |
| `chat:typing` | `{ appointmentId, isTyping: true\|false }` | — (tidak persist) |

Join queue: pasien punya janji sesi itu, dokter pemilik, atau admin. Join chat: hanya dua peserta (admin ditolak).

### Server → client

| Event | Kapan | Payload ringkas |
| --- | --- | --- |
| `queue:updated` | buka sesi, booking masuk board, cancel, skip, mulai/selesai konsul | `{ doctorId, date, session, nowServing, items: [{ queueNumber, patientNameMasked, status }], updatedAt }` |
| `queue:called` | Panggil | `{ doctorId, date, session, queueNumber, appointmentId, calledAt }` |
| `queue:completed` | Selesai konsul | `{ doctorId, date, session, queueNumber, appointmentId }` |
| `chat:message` | POST pesan sukses | `{ appointmentId, message: { id, senderId, senderRole, body, createdAt } }` |
| `chat:typing` | lawan mengetik | `{ appointmentId, userId, isTyping }` |
| `chat:read` | POST …/read | `{ appointmentId, userId, lastReadAt, lastReadMessageId }` |
| `notification:new` | notifikasi baru | objek notifikasi (sama REST) |

Reconnect: GET REST hydrate, lalu `join` room lagi. Server tidak replay event lama. Indikator typing hilang ~2 detik tanpa event baru.

Pola chat: REST simpan dulu, server yang emit. Jangan `socket.emit` isi pesan dari client.

---

## Error

| HTTP | Arti khas |
| --- | --- |
| 400 | Validasi body/query, tanggal lampau, file bukan gambar, JSON rusak |
| 401 | Belum login / token kadaluarsa / kredensial salah |
| 403 | Role atau ownership salah; signature Midtrans invalid |
| 404 | Resource tidak ada; path di luar `/api` → `{ "error": "Endpoint tidak ditemukan" }` |
| 409 | Kuota, double-book, email duplikat, panggil kosong, double pay, chat read-only, FK masih dipakai |
| 500 | Env belum lengkap (Snap, Gemini+Groq, ImageKit, `SECRET_KEY` production) |
| 502 | Gagal unggah ImageKit |

Tidak pernah mengembalikan `passwordHash` atau Midtrans/Gemini/Groq server key.

---

## Akun demo

Password: `password123`

| Role | Email |
| --- | --- |
| Admin | `admin@mediflow.test` |
| Dokter Gigi | `dokter.gigi@mediflow.test` |
| Dokter Umum | `dokter.umum@mediflow.test` |
| Pasien | `pasien@mediflow.test` |

Poli tutup Minggu. Demo Panggil + chat: booking tanggal **hari ini** (Senin–Sabtu), buka sesi, Panggil, selesai konsul, **baru** kirim pesan.
