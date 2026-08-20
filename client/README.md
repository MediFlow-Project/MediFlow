# MediFlow client

Portal RS MediFlow (React + Vite). Berjalan bersama API di folder `Server`.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Aplikasi biasanya di `http://localhost:5173`. API default `http://localhost:3000`.

| Variabel | Arti |
| --- | --- |
| `VITE_API_URL` | Base URL REST, termasuk `/api` |
| `VITE_SOCKET_URL` | Origin Socket.IO (tanpa `/api`) |

Chatbot Gemini/Groq dan pembayaran Midtrans dikonfigurasi di `Server/.env`, bukan di client. Tanpa kunci server, widget chatbot dan bayar menampilkan pesan konfigurasi belum tersedia.

Kontrak API: [API.md](../API.md).

## Skrip

- `npm run dev` — development
- `npm run build` / `npm run preview` — production build
- `npm run lint` — ESLint

## Akun uji

Password seed: `password123`

- `admin@mediflow.test`
- `dokter.umum@mediflow.test`
- `dokter.gigi@mediflow.test`
- `dokter.anak@mediflow.test`
- `pasien@mediflow.test`

## Alur singkat

- Publik: `/layanan`, profil dokter, login/daftar
- Pasien: dashboard `/saya`, booking, antrean, pesan, tagihan, akun `/akun`
- Dokter: praktik `/dokter`, pesan, akun
- Admin: `/admin/dashboard`
