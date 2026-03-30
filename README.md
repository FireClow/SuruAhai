# SuruAhai

SuruAhai adalah marketplace jasa rumah tangga yang menghubungkan pelanggan (USER) dengan penyedia jasa (MITRA), serta menyediakan panel operasional untuk ADMIN.

Dokumen ini berisi panduan lengkap untuk menjalankan, mengembangkan, dan menguji proyek secara lokal.

## Daftar Isi

1. [Ringkasan Proyek](#ringkasan-proyek)
2. [Fitur Utama](#fitur-utama)
3. [Arsitektur & Tech Stack](#arsitektur--tech-stack)
4. [Struktur Folder](#struktur-folder)
5. [Prasyarat](#prasyarat)
6. [Konfigurasi Environment](#konfigurasi-environment)
7. [Menjalankan Proyek Lokal](#menjalankan-proyek-lokal)
8. [Data Seed & Akun Default](#data-seed--akun-default)
9. [Panduan API](#panduan-api)
10. [Pengujian](#pengujian)
11. [Troubleshooting](#troubleshooting)
12. [Roadmap Singkat](#roadmap-singkat)

## Ringkasan Proyek

SuruAhai menyediakan alur end-to-end untuk:

- Registrasi/login berbasis role (USER, MITRA, ADMIN)
- Jelajah layanan dan kategori
- Booking mitra dengan jadwal
- Simulasi pembayaran escrow
- Manajemen status order
- Rating & review mitra
- Dashboard operasional per role

## Fitur Utama

### USER

- Registrasi & login
- Lihat kategori layanan
- Jelajah daftar layanan
- Buat pesanan (booking)
- Lihat riwayat dan detail pesanan
- Lihat saldo wallet + transaksi
- Beri review setelah order selesai

### MITRA

- Registrasi sebagai mitra
- Dashboard performa (order, rating, earnings)
- Toggle status online/offline
- Kelola status pesanan (confirm, in progress, complete, cancel)
- Lihat saldo wallet

### ADMIN

- Dashboard agregasi (GMV, escrow, revenue)
- Kelola pengguna (aktif/suspend)
- Verifikasi mitra
- Monitor escrow

## Arsitektur & Tech Stack

### Frontend

- React 18
- React Router DOM
- Axios
- Tailwind CSS
- Sonner (toast)
- Lucide React (icon)

### Backend

- FastAPI
- MongoDB (PyMongo)
- JWT Authentication (python-jose)
- Password hashing (passlib + bcrypt)

### Pola Integrasi

- Frontend memanggil backend melalui `REACT_APP_BACKEND_URL`
- Token JWT disimpan di `localStorage`
- Axios interceptor otomatis menambahkan `Authorization: Bearer <token>`

## Struktur Folder

```text
SuruAhai/
├── backend/
│   ├── server.py
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── contexts/
│       ├── pages/
│       └── services/
├── backend_test.py
└── README.md
```

## Prasyarat

- Python 3.10+ (disarankan 3.11)
- Node.js 18+ dan npm
- MongoDB (lokal atau remote)

## Konfigurasi Environment

### Backend (`backend/.env`)

Contoh:

```env
MONGO_URL=mongodb://127.0.0.1:27017
DB_NAME=suruahai
JWT_SECRET=super-secret-key-change-this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Catatan:

- `MONGO_URL` wajib menunjuk instance MongoDB aktif.
- `JWT_SECRET` wajib diganti untuk environment selain development.

### Frontend (`frontend/.env`)

Contoh:

```env
REACT_APP_BACKEND_URL=http://127.0.0.1:8001
```

Jika tidak diisi, frontend fallback ke `http://127.0.0.1:8001`.

## Menjalankan Proyek Lokal

## 1) Jalankan Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
# source .venv/bin/activate

pip install -r requirements.txt
python server.py
```

Backend default berjalan di:

```text
http://127.0.0.1:8001
```

## 2) Jalankan Frontend

```bash
cd frontend
npm install
npm start
```

Frontend default berjalan di:

```text
http://127.0.0.1:3000
```

## Data Seed & Akun Default

Setelah backend jalan, lakukan seed data:

```bash
curl -X POST http://127.0.0.1:8001/api/seed
```

Atau melalui frontend/API client.

Admin default yang dibuat oleh seed:

- Email: `admin@suruahai.com`
- Password: `admin123`

## Panduan API

Base URL:

```text
http://127.0.0.1:8001
```

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Services

- `GET /api/services`
- `GET /api/services/{service_id}`
- `POST /api/services` (ADMIN)
- `GET /api/services/categories/list`

### Mitra

- `GET /api/mitra/list`
- `GET /api/mitra/{mitra_id}`
- `GET /api/mitra/dashboard` (MITRA)
- `PUT /api/mitra/profile` (MITRA)
- `PUT /api/mitra/toggle-online` (MITRA)

### Orders

- `POST /api/orders` (USER)
- `GET /api/orders`
- `GET /api/orders/{order_id}`
- `PUT /api/orders/{order_id}/status?status=<STATUS>`

Status valid:

- `CONFIRMED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED`

### Wallet & User

- `PUT /api/user/profile`
- `GET /api/user/wallet`
- `GET /api/wallet`
- `GET /wallet`

### Reviews

- `POST /api/reviews`
- `GET /api/reviews/mitra/{mitra_id}`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `PUT /api/admin/users/{user_id}/status?is_active=<true|false>`
- `PUT /api/admin/mitra/{mitra_id}/verify`
- `GET /api/admin/escrow`

### Notifications

- `GET /api/notifications`

## Pengujian

Tersedia script smoke/integration test sederhana:

```bash
python backend_test.py
```

Gunakan base URL custom bila perlu:

```bash
# Windows PowerShell
$env:API_BASE_URL="http://127.0.0.1:8001"
python backend_test.py
```

Script akan menguji endpoint kritikal seperti:

- health
- seed
- auth register/login
- dashboard per role
- wallet
- mitra list

## Troubleshooting

### 1) Backend error hash password (passlib/bcrypt)

Gunakan kombinasi dependency berikut (sudah dipin di requirements):

- `passlib[bcrypt]==1.7.4`
- `bcrypt==3.2.2`

Jika environment lama masih cache paket, reinstall clean:

```bash
pip uninstall bcrypt passlib -y
pip install -r requirements.txt
```

### 2) Frontend tidak bisa akses backend

- Pastikan backend hidup di port `8001`
- Pastikan `REACT_APP_BACKEND_URL` benar
- Cek CORS/proxy lokal

### 3) Build warning Node `DEP0176 fs.F_OK`

Ini warning deprecasi dari dependency transitive dan tidak memblokir build.

### 4) Error MongoDB connection

- Pastikan MongoDB aktif
- Validasi `MONGO_URL` di `backend/.env`
- Pastikan network/credential benar jika pakai MongoDB remote

## Roadmap Singkat

Prioritas pengembangan berikutnya:

- Email verification
- Forgot/reset password
- Upload dokumen verifikasi mitra
- Integrasi payment gateway nyata
- Notifikasi real-time

---

Jika dibutuhkan, dokumentasi ini bisa dipecah menjadi:

- `docs/API.md` (detail request/response per endpoint)
- `docs/DEPLOYMENT.md` (deploy frontend/backend)
- `docs/CONTRIBUTING.md` (workflow kontribusi)