# Pembagian Tugas — MediFlow

Sumber kebenaran produk: [`PRD.md`](./PRD.md). Kontrak field JSON dan enum status **tidak boleh diubah sendirian**.

| Orang | Peran | Fokus |
| --- | --- | --- |
| **Wira** | Frontend | UI + Socket.IO client |
| **Raihan** | Backend 1 | Core + antrean + **satu** server `io` |
| **Salsa** | Backend 2 | Resep, bayar, chatbot Gemini, persistensi chat |

Raihan pemilik fitur yang dinilai di bootcamp (antrean live).  
Salsa pemilik cerita setelah pasien dipanggil + REST chat.  
Wira mengurutkan halaman mengikuti prioritas demo, bukan semua layar sekaligus.

Frontend adalah bottleneck. Raihan dan Salsa harus lebih dulu men-deliver kontrak API + seeder, supaya Wira tidak menunggu.

---

## Ringkasan milik siapa

### Wira — Frontend

**Milik:** folder frontend. Semua halaman React, routing, proteksi role, Redux, Axios + Bearer, Socket.IO **client**, `QueueBoard`, `ChatThread` + inbox.

**Fase 1 (bersama Raihan):** landing, login/register, spesialisasi/dokter, booking, dashboard pasien, board antrean pasien + dokter (Panggil, Lewati, Buka sesi).

**Fase 2 (bersama Salsa):** form konsul + obat, rincian tagihan, tombol Bayar Snap, chatbot, admin CRUD (boleh polos), **baru kemudian** chat thread/inbox (setelah board antrean hidup).

**Jangan:** Express, migrasi, kuota, JWT sign, webhook Midtrans, Gemini key, persist `Message`.

Komponen wajib share: `QueueBoard` (pasien dan dokter beda aksi, data sama) dan `ChatThread` (patient dan doctor).

### Raihan — Backend 1 (Core + antrean)

**Model:** `User`, `Specialty`, `Doctor`, `Schedule`, `Appointment`

**API:** auth register/login JWT + middleware role, GET publik spesialisasi & dokter & sisa kuota, booking/cancel (kuota, nomor antrean, anti double-book), open session, call, skip, start consult, GET hydrate board antrean, admin CRUD master (spesialisasi/dokter/jadwal).

**Socket.IO:** **satu** server `io`. Room `queue:{doctorId}:{date}:{session}`. Event `queue:updated`, `queue:called`, `queue:completed`. Auth JWT. Helper emit `chat:*` + guard join `chat:{appointmentId}`. Jangan buat server socket kedua.

**Seeder:** 1 admin, 20 poli × 5 dokter (JSON), jadwal, 1 pasien demo.

**Jangan:** Midtrans, Gemini, hitung invoice, tabel `Message`/`ChatRead` (itu Salsa), React.

Selesai dulu sampai: dua browser, tombol Panggil, nomor bergerak tanpa refresh.

### Salsa — Backend 2 (Pasca-konsul + chat persistensi)

**Model baru:** `Consultation`, `Medicine`, `PrescriptionItem`, `Invoice`, `Message`, `ChatRead`  
Bergantung `Appointment` milik Raihan. Jangan menduplikasi atau mengedit kolom tabel appointment. Hanya FK ke `Appointment`.

**API:** CRUD obat (admin), complete consultation + item resep + generate invoice, Snap token + webhook Midtrans + GET invoice, POST chatbot Gemini, GET dashboard admin, REST `/chats` dan `/appointments/:id/messages`. Setelah simpan pesan / tandai dibaca, panggil helper emit Raihan.

**Jangan:** booking, kuota, event `queue:called`, nama room queue, server socket kedua, rewrite auth.

Kerja paralel dengan Raihan begitu `Appointment` + status `in_consultation` / `completed` sudah disepakati.

---

## Chat secara spesifik

- **Raihan:** sediakan `io` + helper `emitChatMessage` / `emitChatTyping` / `emitChatRead` + guard join room `chat:{appointmentId}`. Jangan buat server socket kedua.
- **Salsa:** migrasi `Message` dan `ChatRead`, REST `/chats` dan `/appointments/:id/messages`, validasi peserta + status writable, lalu panggil helper Raihan.
- **Wira:** kerjakan chat **setelah** board antrean live. Hydrate REST, baru subscribe socket.

Checkpoint 1: dua browser, tombol Panggil, antrean bergerak tanpa refresh.  
Checkpoint 2: dua browser, kirim pesan + typing + sudah dibaca, tanpa refresh.

---

## Kontrak hari pertama (bertiga)

Tanpa ini, dua backend akan bentrok dan frontend terblokir.

- Enum appointment: `booked | waiting | called | in_consultation | completed | cancelled | no_show`
- Enum invoice: `unpaid | pending | paid | expire | failed`
- Room queue + 3 event `queue:*`; room chat + `chat:message` / `chat:typing` / `chat:read`
- Bentuk JSON booking, board antrean, complete konsultasi, pesan chat — lihat `PRD.md` bagian 17
- Migrasi awal: **Raihan**. Salsa hanya menambah migrasi modelnya, tidak mengedit tabel `Appointment`
- Dummy akun: `admin@mediflow.test`, dokter, pasien — password sama, tulis di README server

Jangan membelah Socket.IO: server = Raihan, client = Wira.  
Jangan membelah tabel `Appointment` ke dua orang.  
Jangan keduanya menulis webhook Midtrans.

---

## Timeline

```text
Hari 1        Bertiga: kontrak API + ERD + repo (client / server)
Hari 1–3      Raihan: auth, seed, dokter, booking, socket
              Salsa: model obat/invoice/Message + Gemini (boleh mock)
              Wira: layout, auth, direktori, booking (mock boleh)
Hari 3–5      Integrasi CORE: Wira + Raihan, demo Panggil harus jalan
Hari 5–7      Salsa + Wira: konsul, resep, Midtrans, chatbot, lalu chat live
Hari terakhir Seed skenario demo 5 menit + edge case kuota/webhook
```

Checkpoint tengah: **antrean live sudah bisa didemo**. Baru lanjut Midtrans, chatbot, dan chat.

---

## Kolaborasi

- Raihan dan Salsa kirim **Postman / Thunder Client** tiap endpoint yang selesai, bukan “nanti gabung di akhir”.
- Wira butuh CORS + seed dari hari 2, bukan hari terakhir.
- Admin CRUD boleh dikerjakan Wira terakhir; kalau waktu habis, admin cukup bisa login dan lihat tabel polos.
- Kalau Wira kehabisan waktu di fase 2, **Salsa boleh bantu halaman admin** (HTML/React sederhana) — jangan minta Salsa menyentuh board antrean.

---

## Cara pakai brief AI

Tiap anggota copy **hanya blok miliknya** ke AI. Brief mandiri: AI tidak wajib baca chat lama, tapi wajib patuhi `PRD.md` untuk field JSON.

Tempel brief → kirim folder yang diizinkan → minta AI kerja **hanya di file milik orang itu**.

---

## Brief Wira — Frontend

```text
Kamu adalah SATU-SATUNYA engineer Frontend untuk project fullstack MediFlow. Nama: Wira.
Kerjakan HANYA folder frontend (contoh: client/, src/, web/). Jangan menulis backend, migrasi database, webhook, atau pemanggilan Gemini/Midtrans server key.

Baca PRD.md di root repo. Jangan mengubah kontrak API.

═══════════════════════════════════════
KONTEKS PRODUK (JANGAN DIUBAH)
═══════════════════════════════════════
MediFlow = Realtime Hospital Management untuk SATU rumah sakit fiktif (RS MediFlow).
Capstone berwaktu pendek.
Fitur demo WAJIB:
1) antrean realtime Socket.IO TANPA refresh
2) chat teks dokter–pasien live (pesan, typing, sudah dibaca) TANPA refresh

Role user: Patient, Doctor, Admin saja.
Jangan menambah perawat, resepsionis, apoteker, kasir, multi-RS, Google Maps, rating, BPJS, IGD, lab, walk-in, telemedicine, video/voice, file di chat.

Alur:
Landing publik → cari spesialisasi / nama dokter / chatbot AI → login → booking SESI pagi/siang (bukan slot jam 10:00) → dapat nomor antrean → thread chat appointment otomatis ada → dokter buka sesi → dokter tekan Panggil → pasien melihat update live → konsul → resep dari katalog obat → tagihan (fee konsul + obat) → pasien bayar Midtrans Snap sandbox.

Chat dokter BUKAN chatbot Gemini. Chatbot = rekomendasi sebelum booking. Chat dokter = manusia, setelah ada appointment.

Auth:
- Landing + daftar spesialisasi/dokter = publik
- Register hanya Patient
- Doctor & Admin akun seed (hanya login)
- Login wajib untuk: chatbot AI, booking, chat dokter, antrean, resep, bayar

UI Bahasa Indonesia. Patient mobile-friendly. Doctor/Admin desktop.

Stack frontend WAJIB:
- React.js + Vite + React Router + Redux Toolkit + Axios + Tailwind CSS + Socket.IO Client
Jangan ganti stack. Jangan tambah library besar tanpa perlu (jangan Next.js, jangan MUI, jangan React Query kecuali sudah ada di repo).

═══════════════════════════════════════
MILIK KAMU
═══════════════════════════════════════
Semua halaman, routing, proteksi route by role, Redux (auth, queue, appointments, chat), Axios instance (baseURL + Bearer token), Socket.IO client, layout, empty/loading/error state.

Halaman:
Publik: Landing (3 pintu: spesialisasi, cari dokter, chatbot), list spesialisasi, list/detail dokter + chip sesi + sisa kuota, Login, Register
Patient: Chatbot AI, konfirmasi booking, dashboard appointment (badge unread chat), board antrean live, thread chat dokter, detail resep+tagihan+tombol Bayar Snap, riwayat (chat read-only)
Doctor: inbox chat, sesi hari ini, board antrean (Buka sesi, Panggil, Lewati, Mulai konsul, buka chat pasien), form konsultasi+resep, thread chat
Admin: dashboard angka, CRUD spesialisasi/dokter/jadwal/obat (UI sederhana boleh), list appointment & pembayaran. TIDAK ADA chat admin.

Komponen wajib:
- QueueBoard dipakai pasien & dokter (data sama, aksi beda)
- ChatThread dipakai patient & doctor
Highlight antrean: nomor sedang dipanggil, nomor saya, sisa antrean di depan.
Chat: gelembung kiri/kanan, timestamp, typing, centang terkirim vs sudah dibaca, input disabled + teks “Chat ditutup” jika read-only.
Badge status appointment & invoice.
Disclaimer chatbot AI selalu terlihat: bukan diagnosa / bukan pengganti dokter. Jangan samakan UI chatbot dengan chat dokter.

═══════════════════════════════════════
BUKAN MILIK KAMU
═══════════════════════════════════════
- Sequelize, Express route, JWT sign, bcrypt
- Logika kuota, penomoran antrean, state machine server
- Socket.IO SERVER dan nama room (kamu hanya JOIN dan LISTEN sesuai kontrak)
- Midtrans server key, webhook, signature
- Gemini API key (kamu hanya POST /api/chatbot/recommend lalu render jawaban)
- Persist Message / ChatRead
- Jangan mengarang endpoint baru. Pakai kontrak di PRD.md. Jika endpoint belum ada, mock di frontend secara terisolasi dan tandai TODO.

Backend 1 (antrean + io) = Raihan.
Backend 2 (resep, Midtrans, Gemini, REST chat) = Salsa.

═══════════════════════════════════════
KONTRAK API (WAJIB DIPATUHI)
═══════════════════════════════════════
Base: /api
Header login: Authorization: Bearer <jwt>
JWT payload berisi userId dan role: patient | doctor | admin
Error: { "error": "pesan indonesia" }

Publik:
POST /api/auth/register  { name, email, password, phone }
POST /api/auth/login     { email, password } → { accessToken, user: { id, name, email, role } }
GET  /api/specialties
GET  /api/specialties/:id
GET  /api/doctors?specialtyId=&name=
GET  /api/doctors/:id   (profil + jadwal + sisa kuota)

Patient & Doctor (chat):
GET  /api/chats
GET  /api/appointments/:id/messages
POST /api/appointments/:id/messages       { body }
POST /api/appointments/:id/messages/read

Patient:
GET  /api/me
POST /api/chatbot/recommend  { message }
POST /api/appointments       { doctorId, date, session: "morning"|"afternoon" }
GET  /api/appointments
GET  /api/appointments/:id
PATCH /api/appointments/:id/cancel
GET  /api/queues/:doctorId?date=YYYY-MM-DD&session=morning|afternoon
GET  /api/invoices/:id
POST /api/invoices/:id/pay   → { snapToken, clientKey }

Doctor:
GET  /api/doctor/sessions/today
POST /api/doctor/sessions/open   { date, session }
GET  /api/doctor/queues?date=&session=
POST /api/doctor/queues/call
POST /api/doctor/queues/skip     { appointmentId }
POST /api/doctor/consultations/start    { appointmentId }
POST /api/doctor/consultations/complete { appointmentId, complaint, diagnosis, notes, items: [{ medicineId, quantity, dosage }] }

Admin:
CRUD /api/admin/specialties
CRUD /api/admin/doctors
CRUD /api/admin/schedules
CRUD /api/admin/medicines
GET  /api/admin/appointments
GET  /api/admin/invoices
GET  /api/admin/dashboard

Error: 401 unauth, 403 forbidden, 400 validasi, 409 konflik (kuota penuh, double-book, cancel terlambat, panggil kosong, double pay, chat read-only). Tampilkan pesan dari body.error.

Appointment status:
booked | waiting | called | in_consultation | completed | cancelled | no_show
Cancel hanya jika booked atau waiting.
Chat writable hanya `completed` sampai H+1 tanggal kunjungan. Sebelum/saat pemeriksaan, cancelled, no_show, dan setelah H+1: read-only.

Invoice status:
unpaid | pending | paid | expire | failed
Tombol Bayar hanya unpaid/pending/expire/failed, JANGAN jika paid.

═══════════════════════════════════════
KONTRAK SOCKET.IO CLIENT
═══════════════════════════════════════
Satu koneksi Socket.IO per client. Connect dengan JWT.
Client boleh join lebih dari satu room (antrean + thread chat yang sedang dibuka).

Room antrean: queue:{doctorId}:{YYYY-MM-DD}:{morning|afternoon}
Listen HANYA:
- queue:updated  { doctorId, date, session, nowServing, items: [{ queueNumber, patientNameMasked, status }], updatedAt }
- queue:called    { doctorId, date, session, queueNumber, appointmentId, calledAt }
- queue:completed { doctorId, date, session, queueNumber, appointmentId }

Room chat: chat:{appointmentId}
Listen:
- chat:message { appointmentId, message: { id, senderId, senderRole, body, createdAt } }
- chat:typing  { appointmentId, userId, isTyping }
- chat:read    { appointmentId, userId, lastReadAt }

Kirim pesan BUKAN via socket emit dari client. Pola: REST simpan dulu, server yang emit.
Typing: client boleh emit isTyping; indikator hilang ~2 detik.
Sudah dibaca: POST .../read; UI centang 1 = ada id dari REST, centang 2 = lastReadAt lawan >= createdAt pesan.

Pola data: hydrate dulu via REST, BARU subscribe socket. Saat reconnect: GET lagi lalu join ulang.
Jangan polling sebagai pengganti socket. Jangan minta event tambahan.

Aksi dokter (Buka sesi / Panggil / Lewati / Mulai konsul) = REST, bukan socket emit.

═══════════════════════════════════════
URUTAN KERJA (WAJIB)
═══════════════════════════════════════
Fase 1 (prioritas demo, bersama Raihan):
1. Axios + Redux auth + login/register + route guard
2. Landing + spesialisasi + dokter + booking
3. QueueBoard pasien + dokter + aksi REST dokter + socket live
STOP dan pastikan dua browser: Panggil mengubah angka tanpa refresh.

Fase 2 (bersama Salsa):
4. Form konsul + pilih obat
5. Tagihan + Snap (window.snap.pay(snapToken))
6. Chatbot AI UI
7. Admin CRUD (boleh polos)
8. ChatThread + inbox + typing + sudah dibaca (SETELAH board antrean hidup)

Jika waktu mepet: korbankan keindahan admin/chatbot, JANGAN korbankan board antrean. Chat boleh UI sederhana, event harus hidup.

═══════════════════════════════════════
ATURAN AI
═══════════════════════════════════════
- Jangan refactor besar di luar tugas.
- Jangan menambah role, halaman IGD, maps, rating, video, file chat.
- Jangan simpan Gemini/Midtrans secret di frontend. .env frontend maksimal VITE_API_URL dan VITE_MIDTRANS_CLIENT_KEY.
- Tulis komponen kecil, reusable, nama jelas.
- Semua teks UI Indonesia.
- Jika backend belum siap, buat mock terpisah, jangan mengubah bentuk kontrak.
- Definition of done fase 1: login 3 role, booking dapat nomor, board live 2 browser.
- Definition of done chat: dua browser, pesan muncul tanpa refresh, typing terlihat, centang sudah dibaca.
```

---

## Brief Raihan — Backend 1 (Core + antrean)

```text
Kamu adalah Backend 1 (pemilik CORE) untuk project fullstack MediFlow. Nama: Raihan.
Kamu pemilik antrean realtime dan SATU instance Socket.IO server. Ini fitur yang dinilai di bootcamp.
Kerjakan HANYA backend bagianmu. Jangan menulis React. Jangan mengerjakan Midtrans, Gemini, katalog obat, invoice, complete consultation, atau tabel Message/ChatRead (itu Salsa / Backend 2).

Baca PRD.md di root repo. Jangan mengubah kontrak field JSON.

═══════════════════════════════════════
KONTEKS PRODUK (JANGAN DIUBAH)
═══════════════════════════════════════
MediFlow = satu rumah sakit (RS MediFlow), capstone pendek.
Role: Patient, Doctor, Admin. Register hanya Patient. Doctor & Admin via seeder.
Booking = tanggal + session morning|afternoon. BUKAN slot jam 10:00/10:15.
Nomor antrean = urutan booking, unik per (doctorId, date, session), selama kuota belum penuh.
Dokter buka sesi → pasien waiting. Dokter tekan Panggil → semua client di room dapat event tanpa refresh.

Setelah booking, pasien dan dokter bisa chat teks. Kamu TIDAK menulis REST chat / tabel Message.
Kamu HANYA sediakan io + helper emit chat + guard join room chat:{appointmentId}.

Stack backend WAJIB:
Node.js, Express.js, Sequelize, PostgreSQL, JWT, bcrypt, Socket.IO, dotenv
Pola MVC. REST untuk persistensi. Socket.IO HANYA untuk broadcast.
Jangan ganti ORM, jangan tambah Redis, jangan GraphQL.
SATU server Socket.IO. Jangan dua server terpisah.

═══════════════════════════════════════
MILIK KAMU (FILE / MODUL)
═══════════════════════════════════════
- Bootstrap server HTTP + attach Socket.IO (app.js / bin / listen)
- Middleware JWT + role
- Models + migrasi: User, Specialty, Doctor, Schedule, Appointment
- Seeder: 1 admin, 20 poli × 5 dokter (dari JSON), jadwal, 1 pasien demo
- Routes:
  POST /api/auth/register
  POST /api/auth/login
  GET  /api/me
  GET  /api/specialties
  GET  /api/specialties/:id
  GET  /api/doctors  query specialtyId, name
  GET  /api/doctors/:id  termasuk sisa kuota per tanggal/sesi
  POST /api/appointments
  GET  /api/appointments          (patient: milik sendiri; jangan bocor data orang lain)
  GET  /api/appointments/:id
  PATCH /api/appointments/:id/cancel
  GET  /api/queues/:doctorId?date=&session=
  GET  /api/doctor/sessions/today
  POST /api/doctor/sessions/open
  GET  /api/doctor/queues
  POST /api/doctor/queues/call
  POST /api/doctor/queues/skip
  POST /api/doctor/consultations/start   (HANYA ubah status ke in_consultation; JANGAN form resep)
- Socket.IO server: auth JWT, join/leave room queue DAN chat, emit event
- Helper yang Salsa boleh import:
  emitQueueUpdated, emitQueueCalled, emitQueueCompleted
  emitChatMessage, emitChatTyping, emitChatRead
- Admin CRUD yang terkait modelmu (boleh setelah core live):
  CRUD /api/admin/specialties
  CRUD /api/admin/doctors   (create dokter = buat User role doctor + row Doctor)
  CRUD /api/admin/schedules
  GET  /api/admin/appointments

Kamu BOLEH menambahkan GET /api/admin/dashboard COUNT dari Appointment, atau biarkan Salsa — jika belum ada, sediakan query helper. Jangan blokir Salsa.

═══════════════════════════════════════
BUKAN MILIK KAMU
═══════════════════════════════════════
Jangan buat model Consultation, Medicine, PrescriptionItem, Invoice, Message, ChatRead.
Jangan buat POST /api/doctor/consultations/complete.
Jangan Midtrans, webhook, Snap token.
Jangan Gemini / POST /api/chatbot/recommend.
Jangan CRUD /api/admin/medicines atau /api/admin/invoices.
Jangan REST /api/chats atau /api/appointments/:id/messages (itu Salsa; Salsa panggil helper emit milikmu).
Jangan edit folder frontend.
Jangan buat server Socket.IO kedua.

Frontend = Wira. Backend 2 = Salsa.

═══════════════════════════════════════
MODEL YANG KAMU BOLEH SENTUH
═══════════════════════════════════════
User: id, name, email unique, passwordHash, phone, role enum patient|doctor|admin
Specialty: id, name unique, description
Doctor: id, userId unique FK, specialtyId FK, consultationFee, bio
Schedule: id, doctorId, dayOfWeek, session morning|afternoon, startTime, endTime, quota
  unique (doctorId, dayOfWeek, session)
Appointment: id, patientId, doctorId, date, session, queueNumber, status
  unique aktif (patientId, doctorId, date, session)
  unique (doctorId, date, session, queueNumber)

Appointment status enum:
booked | waiting | called | in_consultation | completed | cancelled | no_show

Transisi yang KAMU implementasikan:
- POST appointments → booked, queueNumber = max+1, tolak jika kuota penuh / tanggal lampau / tidak ada schedule hari itu / double-book aktif
- cancel: hanya booked atau waiting → cancelled (409 jika already called+)
- open session: booked pada doctor+date+session → waiting, lalu emit queue:updated
- call: waiting dengan queueNumber terkecil → called; 409 jika tidak ada; emit queue:called + queue:updated
- skip: waiting atau called → no_show; emit queue:updated
- start consult: called → in_consultation; emit queue:updated

Aktif untuk kuota = semua status kecuali cancelled. no_show tetap memakai kuota.
Sisa kuota = quota - count(appointment kecuali cancelled) untuk doctor+date+session.
dayOfWeek harus match tanggal booking.
JANGAN kirim passwordHash ke client.

═══════════════════════════════════════
SOCKET.IO (MILIK MUTLAK KAMU)
═══════════════════════════════════════
Room antrean PERSIS:
queue:{doctorId}:{YYYY-MM-DD}:{morning|afternoon}

Handshake wajib JWT. Tolak join queue jika:
- bukan patient yang punya appointment di sesi itu, dan
- bukan doctor pemilik, dan
- bukan admin

Room chat PERSIS:
chat:{appointmentId}
Join hanya patient pemilik appointment dan doctor pemilik. Admin ditolak.

Emit antrean HANYA 3 event (jangan tambah):
queue:updated
  { doctorId, date, session, nowServing, items: [{ queueNumber, patientNameMasked, status }], updatedAt }
queue:called
  { doctorId, date, session, queueNumber, appointmentId, calledAt }
queue:completed
  { doctorId, date, session, queueNumber, appointmentId }
  (dipanggil juga oleh Salsa setelah complete — EKSPOS helper emitQueueCompleted yang Salsa bisa import)

Helper chat (Salsa yang persist, kamu yang emit):
emitChatMessage / emitChatTyping / emitChatRead
Payload sesuai PRD.md bagian 9.2.

Pola: REST mengubah DB dulu, BARU emit. Socket bukan sumber kebenaran.
patientNameMasked contoh: "Andi S."

═══════════════════════════════════════
KONTRAK JSON UNTUK FRONTEND (JANGAN DIGANTI NAMA FIELD)
═══════════════════════════════════════
Login response: { accessToken, user: { id, name, email, role } }
Error body: { error: "pesan indonesia" } + status 400/401/403/409
GET queues / doctor queues items: { queueNumber, patientNameMasked, status, appointmentId }
nowServing: number atau null
CORS izinkan origin frontend Vite.

═══════════════════════════════════════
SEEDER DEMO
═══════════════════════════════════════
admin@mediflow.test
20 poli × 5 dokter (JSON `Server/seeders/data/`), termasuk akun demo Umum/Gigi/Anak
jadwal sesuai `doctors.json`; pagi 08:00–12:00 kuota 10, siang 13:00–17:00 kuota 8
100 obat di `medicines.json`
1 pasien demo
Password demo sama semua, dokumentasikan di README server.

═══════════════════════════════════════
URUTAN KERJA
═══════════════════════════════════════
1. Init Express+Sequelize+Postgres, User+auth JWT
2. Specialty, Doctor, Schedule + seeder + GET publik
3. Appointment booking + kuota + nomor + cancel
4. Open session + GET queues
5. Socket.IO attach + join room queue + call/skip + emit
6. start consult + helper emit chat (kosong dulu, Salsa yang panggil)
7. Admin CRUD master (setelah 5 jalan)

Definition of done: dua client join room yang sama; POST call; kedua client terima queue:called tanpa refresh. Ini lebih penting daripada admin CRUD.

═══════════════════════════════════════
KOLABORASI
═══════════════════════════════════════
- Kamu pemilik migrasi awal. Salsa HANYA menambah migrasi modelnya, tidak mengubah tabel Appointment.
- Export helper emit dari folder sockets/ agar Salsa bisa emit queue:completed dan chat:*.
- Jangan rebase/force tanpa minta. Jangan rewrite file route index milik orang lain selain mendaftarkan router kamu dengan jelas.
- Tulis README endpoint milikmu.

═══════════════════════════════════════
ATURAN AI
═══════════════════════════════════════
- Jangan overengineering (bukan microservices, bukan queue Redis).
- Jangan menambah event socket di luar daftar PRD.
- Jangan implement Midtrans/Gemini/Message REST “sekalian”.
- Validasi role di backend, bukan percaya body.role dari client.
- Definition of done tidak terpenuhi jika antrean masih harus di-refresh.
```

---

## Brief Salsa — Backend 2 (Resep, bayar, chatbot, chat persistensi)

```text
Kamu adalah Backend 2 (pasca-konsul + persistensi chat) untuk project fullstack MediFlow. Nama: Salsa.
Kamu pemilik resep, tagihan, Midtrans Snap sandbox, chatbot Gemini, admin medicines/invoices, dan REST chat (Message + ChatRead).
Jangan menulis React kecuali diminta eksplisit membantu halaman admin (default: JANGAN).
Jangan mengambil alih antrean realtime. Itu Raihan / Backend 1.

Baca PRD.md di root repo. Jangan mengubah kontrak field JSON.

═══════════════════════════════════════
KONTEKS PRODUK (JANGAN DIUBAH)
═══════════════════════════════════════
Satu rumah sakit, 3 role: Patient, Doctor, Admin.
Setelah dokter start consult (status in_consultation, dikerjakan Raihan), dokter submit resep dari KATALOG OBAT (bukan teks bebas murni).
Tagihan = Doctor.consultationFee + sum(medicine.price * quantity). Snapshot amount di Invoice saat complete.
Pasien bayar sendiri (tidak ada kasir) via Midtrans Snap SANDBOX.
Chatbot: Gemini di BACKEND, rekomendasi spesialis + 1–3 dokter yang SESI-nya masih ada kuota. Bukan diagnosa, bukan saran obat, bukan IGD.
Chat dokter: 1 appointment = 1 thread. Teks 1–1000 karakter. Kamu persist Message + ChatRead dan REST. Raihan yang punya io + helper emit.

Stack: Node.js Express Sequelize PostgreSQL JWT Socket.IO dotenv
Tambahan milikmu: Midtrans Snap, Google Generative AI (Gemini)
API key HANYA di .env server. Jangan pernah kirim GEMINI_API_KEY atau MIDTRANS_SERVER_KEY ke response.

═══════════════════════════════════════
MILIK KAMU
═══════════════════════════════════════
Models + migrasi BARU (jangan edit kolom tabel Raihan):
- Consultation: id, appointmentId unique, complaint, diagnosis, notes
- Medicine: id, name, price
- PrescriptionItem: id, consultationId, medicineId, quantity, dosage
- Invoice: id, appointmentId unique, amount, status, midtransOrderId unique, snapToken nullable
- Message: id, appointmentId FK, senderId FK (User), body, createdAt
- ChatRead: id, appointmentId FK, userId FK, lastReadAt · unique (appointmentId, userId)

Invoice status: unpaid | pending | paid | expire | failed
Satu invoice per appointment. Tolak double pay jika sudah paid.

Routes:
POST /api/doctor/consultations/complete
  body: { appointmentId, complaint, diagnosis, notes, items: [{ medicineId, quantity, dosage }] }
  syarat: caller = dokter pemilik, appointment status = in_consultation
  efek: simpan consultation + items, hitung amount, buat invoice unpaid, appointment → completed, chat terbuka sampai H+1 tanggal kunjungan
  lalu PANGGIL helper emit milik Raihan: queue:completed DAN queue:updated
  Jangan menduplikasi logika room. Import helper dari sockets milik Raihan.
  Jika helper belum ada, buat adapter di file sendiri yang emit ke io dengan room name PERSIS:
  queue:{doctorId}:{YYYY-MM-DD}:{morning|afternoon}
  payload queue:completed: { doctorId, date, session, queueNumber, appointmentId }

GET  /api/invoices/:id          patient hanya milik sendiri; doctor boleh jika appointment-nya
POST /api/invoices/:id/pay      patient; buat Snap token; status → pending; return { snapToken, clientKey }
POST /api/payments/midtrans/notification  webhook, TANPA JWT user, verifikasi signature, idempotent
GET  /api/invoices/:id sudah paid → 409 jika POST pay lagi

POST /api/chatbot/recommend     patient JWT; body { message }
  Ambil dari DB: specialties, doctors, schedule + sisa kuota beberapa hari ke depan (hitung dari Appointment milik Raihan — READ ONLY, jangan ubah booking)
  JANGAN kirim isi chat dokter ke Gemini.
  Kirim context ringkas ke Gemini. Response JSON ke frontend:
  { disclaimer, reply, recommendations: [{ doctorId, doctorName, specialtyName, reason, nextSession: { date, session } }] }
  Jika tidak ada yang cocok: recommendations [], reply jujur, arahkan ke daftar spesialisasi.
  Jangan persist chat history chatbot.
  Jangan kirim data pasien lain ke LLM.

Chat REST:
GET  /api/chats
GET  /api/appointments/:id/messages
POST /api/appointments/:id/messages        { body } lalu panggil emitChatMessage
POST /api/appointments/:id/messages/read   set lastReadAt, emitChatRead
Validasi: hanya dua peserta appointment; admin 403.
Writable hanya status completed sampai H+1 tanggal kunjungan. Selain itu POST 409; GET riwayat tetap boleh untuk peserta.
Body trim, 1–1000 karakter, tanpa HTML. 400 jika kosong/terlalu panjang.
unreadCount = jumlah message lawan yang createdAt > lastReadAt (jika belum ada ChatRead, semua pesan lawan = unread).
Typing TIDAK dipersist. Client emit; server broadcast via helper Raihan.

Admin:
CRUD /api/admin/medicines
GET  /api/admin/invoices
GET  /api/admin/dashboard  { bookingsToday, activeQueues }
  activeQueues = count appointment status waiting|called|in_consultation (READ tabel Appointment, jangan ubah)

Seeder obat: 8–12 medicines + harga.
Opsional: 2–3 message dummy pada satu appointment agar inbox tidak kosong.

═══════════════════════════════════════
BUKAN MILIK KAMU
═══════════════════════════════════════
Jangan ubah model/migrasi User, Specialty, Doctor, Schedule, Appointment (kecuali FK dari tabel baru ke Appointment).
Jangan implement auth register/login (sudah Raihan).
Jangan implement booking, kuota, nomor antrean, open session, call, skip, start consult.
Jangan ganti nama room queue atau menambah event selain memakai queue:completed / queue:updated setelah complete, dan helper chat:* milik Raihan.
Jangan GET /api/doctors rewrite.
Jangan folder frontend (kecuali terdesak admin table, konfirmasi dulu).
Jangan refund, cicilan, pajak, BPJS, stok apotek.
Jangan buat server Socket.IO kedua.
Jangan video/file/edit/hapus pesan.

Frontend = Wira. Backend 1 = Raihan.

═══════════════════════════════════════
MIDTRANS
═══════════════════════════════════════
Snap sandbox.
Order ID unik per invoice (simpan midtransOrderId).
Webhook duplikat: jika invoice sudah paid, ignore (idempotent).
Map notifikasi ke: paid / expire / failed. pending saat token dibuat.
Return URL cukup di-set; frontend yang menampilkan status via GET invoice.
Tidak ada refund.

═══════════════════════════════════════
GEMINI
═══════════════════════════════════════
Panggil dari backend saja.
System instruction: asisten RS MediFlow; rekomendasikan poli/dokter berdasarkan keluhan; bukan dokter; jangan diagnosa; jangan resep; jika darurat, sarankan IGD secara umum tanpa detail medis.
Hanya rekomendasikan doctorId yang ADA di context dan masih ada kuota.
Output harus bisa di-parse (minta JSON dari model, tetap validasi doctorId vs DB sebelum response ke client).
Jangan kirim isi chat dokter ke LLM.

═══════════════════════════════════════
KETERGANTUNGAN KE RAIHAN (BACKEND 1)
═══════════════════════════════════════
Kamu butuh Appointment.status = in_consultation sebelum complete.
Kamu READ Doctor.consultationFee, Schedule, Appointment untuk kuota chatbot dan dashboard.
Jika tabel Appointment belum ada, jangan mengarang skema berbeda — ikuti field: patientId, doctorId, date, session, queueNumber, status.
Jangan race: complete harus transaction Sequelize (consultation + items + invoice + update appointment).
Untuk chat emit dan queue:completed, import helper Raihan. Jangan tulis logic room queue sendiri kecuali helper belum ada (adapter sementara dengan nama room PERSIS).

═══════════════════════════════════════
URUTAN KERJA
═══════════════════════════════════════
1. Migrasi Medicine + seeder obat (bisa paralel hari 1)
2. Consultation + PrescriptionItem + Invoice
3. POST complete + transaction + emit completed (integrasi helper Raihan)
4. GET invoice + POST pay Snap + webhook idempotent
5. Chatbot Gemini + validasi ID vs DB
6. Message + ChatRead + REST chat + panggil helper emit
7. Admin medicines, invoices, dashboard

Definition of done:
- Complete konsul membuat invoice amount = fee + obat
- Webhook sandbox mengubah status paid dan tidak double-apply
- Chatbot tidak merekomendasikan dokter kuota 0 atau ID fiktif
- Complete meng-emit event agar board frontend hapus/selesai tanpa refresh
- POST pesan 201, lawan terima chat:message tanpa refresh; read-only setelah completed

═══════════════════════════════════════
ATURAN AI
═══════════════════════════════════════
- Jangan “membantu” dengan menulis ulang socket call/skip.
- Jangan taruh secret di repo.
- Error format sama: { error: "pesan indonesia" }
- Field JSON jangan diganti (snapToken, clientKey, recommendations, medicineId, quantity, dosage, lastMessage, unreadCount).
- Jika konflik merge di app.js, hanya daftarkan router baru, jangan hapus router Raihan.
```

---

## Checkpoint bersama

1. Dua browser, tombol **Panggil**, antrean bergerak tanpa refresh.
2. Dua browser, **pesan chat** muncul tanpa refresh; typing terlihat; sudah dibaca terlihat.

Baru Midtrans dan chatbot dianggap pelengkap in-scope, bukan pengganti Socket.IO.
