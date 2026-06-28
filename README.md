# Kopi Nusantara

> **Aplikasi web pemesanan kopi berbasis QR Code** untuk kedai kopi modern dengan desain Neobrutalism UI.

---

## Tentang Proyek

**Kopi Nusantara** adalah aplikasi web full-stack untuk manajemen kedai kopi yang memungkinkan pelanggan memesan langsung dari meja menggunakan QR Code. Dibangun dengan **React + Vite** di sisi frontend dan **Node.js + MySQL** di sisi backend.

### Desain Neobrutalism UI

Antarmuka mengadopsi gaya **Neobrutalism** — border tebal, warna kontras yang berani, bayangan solid, dan tipografi yang kuat — untuk memberikan kesan yang unik dan modern.

---

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Landing Page** | Halaman utama dengan Hero, About, Menu, Gallery, Testimonials, dan CTA |
| **Menu Digital** | Tampilan menu lengkap: Kopi Panas, Kopi Dingin, Non-Kopi, dan Makanan |
| **Pemesanan via QR** | Pelanggan scan QR, diarahkan ke halaman order sesuai nomor meja otomatis |
| **QR Simulator** | Admin bisa generate & cetak QR Code untuk setiap meja |
| **Admin Dashboard** | Panel lengkap untuk pantau pesanan masuk, kelola menu, dan riwayat transaksi |
| **Manajemen Pengeluaran** | Catat dan lacak pengeluaran operasional kedai |
| **Autentikasi Admin** | Login session-based untuk akses panel admin |
| **Responsif** | Tampilan optimal di desktop maupun perangkat mobile |

---

## Teknologi yang Digunakan

### Frontend
- **[React 18](https://reactjs.org/)** — Library UI utama
- **[Vite 5](https://vitejs.dev/)** — Build tool & dev server yang cepat
- **[Tailwind CSS 3](https://tailwindcss.com/)** — Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** — Animasi dan transisi halus
- **[React Icons](https://react-icons.github.io/react-icons/)** — Library ikon

### Backend
- **[Node.js](https://nodejs.org/)** — Runtime JavaScript server-side (built-in `http` module)
- **[MySQL2](https://github.com/sidorares/node-mysql2)** — Driver MySQL dengan dukungan Promise
- **[dotenv](https://github.com/motdotla/dotenv)** — Manajemen environment variable

### Database
- **MySQL 8.0+** — Database relasional utama
- **phpMyAdmin** — Antarmuka GUI untuk manajemen database (opsional)

### Deployment
- **[Netlify](https://netlify.com/)** — Hosting frontend (konfigurasi tersedia)

---

## Struktur Folder

```
kopi-nusantara/
├── database/
│   └── kopi_nusantara.sql      # Skema & data awal database MySQL
├── netlify/
│   └── functions/              # Netlify serverless functions
├── public/                     # Aset publik statis
├── src/
│   ├── components/             # Komponen UI React
│   │   ├── AdminDashboard.jsx  # Panel admin (pesanan, menu, laporan)
│   │   ├── AdminLogin.jsx      # Halaman login admin
│   │   ├── CustomerOrder.jsx   # Halaman pemesanan pelanggan (via QR)
│   │   ├── QRSimulator.jsx     # Generator & printer QR Code per meja
│   │   ├── Hero.jsx            # Seksi hero landing page
│   │   ├── About.jsx           # Seksi tentang kedai
│   │   ├── Menu.jsx            # Tampilan menu publik
│   │   ├── Gallery.jsx         # Galeri foto kedai
│   │   ├── CTABanner.jsx       # Banner Call-to-Action
│   │   ├── Testimonials.jsx    # Seksi ulasan pelanggan
│   │   ├── Navbar.jsx          # Navigasi utama
│   │   └── Footer.jsx          # Footer halaman
│   ├── data/                   # Data statis aplikasi
│   ├── utils/                  # Fungsi utilitas (storage, export, dll.)
│   ├── App.jsx                 # Komponen root & sistem routing hash-based
│   ├── main.jsx                # Entry point React
│   └── index.css               # Konfigurasi Tailwind & custom styles
├── server.js                   # Backend Node.js + REST API
├── .env.example                # Template konfigurasi environment
├── netlify.toml                # Konfigurasi deploy Netlify
├── vite.config.js              # Konfigurasi Vite
├── tailwind.config.js          # Konfigurasi Tailwind CSS
├── package.json                # Dependensi & skrip NPM
└── JALANKAN.bat                # Skrip cepat jalankan di Windows
```

---

## Cara Menjalankan Secara Lokal

### Prasyarat

Pastikan sudah terinstal:
- [Node.js](https://nodejs.org/) versi **20 atau lebih baru**
- [MySQL](https://dev.mysql.com/downloads/) versi **8.0 atau lebih baru**
- [phpMyAdmin](https://www.phpmyadmin.net/) atau MySQL client lainnya (opsional)

### 1. Clone Repository

```bash
git clone https://github.com/Rezafahmi17/kopi-nusantara.git
cd kopi-nusantara
```

### 2. Setup Database MySQL

1. Buka **phpMyAdmin** atau MySQL
2. Import file skema database:
   ```
   database/kopi_nusantara.sql
   ```
3. Database `kopi_nusantara` akan dibuat otomatis beserta tabel dan data awal menu

### 3. Konfigurasi Environment

Salin file `.env.example` menjadi `.env` dan sesuaikan konfigurasi:

```bash
cp .env.example .env
```

```env
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=        
DB_NAME=kopi_nusantara
```

### 4. Instal Dependensi

```bash
npm install
```

### 5. Build Frontend

```bash
npm run build
```

### 6. Jalankan Server

```bash
npm start
```

> **Atau** gunakan file `JALANKAN.bat` (Windows) untuk menjalankan secara otomatis.


## Mode Development (Frontend)

Untuk pengembangan frontend dengan hot-reload:

```bash
npm run dev
```

Akses di: `http://localhost:5173`

> Catatan: Pada mode dev, fitur yang memerlukan database (pesanan, menu dari API) perlu server backend berjalan terpisah dengan `npm start`.

---

## Routing Aplikasi

Aplikasi menggunakan sistem **hash-based routing**:

| URL | Halaman |
|---|---|
| `/` | Landing Page (Hero, Menu, Gallery, dll.) |
| `/#admin` | Login Admin / Dashboard Admin |
| `/#qr-simulator` | Generator QR Code per meja |
| `/#meja=1` | Halaman Pemesanan Meja 1 |
| `/#meja=5` | Halaman Pemesanan Meja 5 |
| `/#meja=[N]` | Halaman Pemesanan Meja ke-N |

---

## Akses Admin

Untuk mengakses **Admin Dashboard**, gunakan kredensial berikut:

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `kopi123` |

> Sesi admin menggunakan `sessionStorage` — akan logout otomatis saat tab/browser ditutup.

---

## REST API Endpoints

Server berjalan di `http://localhost:3001` dengan endpoint berikut:

### Health Check
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/health` | Cek status server & koneksi MySQL |

### Menu
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/menu` | Ambil semua item menu |
| `POST` | `/api/menu` | Tambah item menu baru |
| `PATCH` | `/api/menu/:id` | Update item menu |
| `DELETE` | `/api/menu/:id` | Hapus item menu |

### Pesanan
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/orders` | Ambil semua pesanan |
| `POST` | `/api/orders` | Buat pesanan baru |
| `PATCH` | `/api/orders/:id` | Update status/pembayaran pesanan |

### Pengeluaran
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/expenses` | Ambil semua pengeluaran |
| `POST` | `/api/expenses` | Tambah pengeluaran baru |
| `DELETE` | `/api/expenses/:id` | Hapus pengeluaran |

---

## Struktur Database

Database `kopi_nusantara` terdiri dari 4 tabel utama:

```sql
menus        -- Daftar item menu (nama, kategori, harga, deskripsi, ikon)
orders       -- Pesanan pelanggan (meja, nama, total, status, pembayaran)
order_items  -- Detail item dalam setiap pesanan (relasi ke menus & orders)
expenses     -- Catatan pengeluaran operasional kedai
```

## Script NPM

```bash
npm run dev      # Jalankan dev server Vite (frontend)
npm run build    # Build frontend untuk produksi
npm run preview  # Preview hasil build
npm start        # Jalankan server Node.js (backend + serve frontend)
npm run server   # Alias untuk npm start
```

---

## Deploy ke Netlify

Proyek sudah dikonfigurasi untuk deploy ke **Netlify** (frontend):

1. Push kode ke GitHub
2. Hubungkan repository di [Netlify Dashboard](https://app.netlify.com/)
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Konfigurasi sudah ada di `netlify.toml`

> Catatan: Untuk fitur penuh (database), diperlukan backend server terpisah.

---

## Lisensi

Proyek ini dibuat untuk keperluan pembelajaran dan pengembangan.

---

Dikembangkan oleh **Reza Fahmi Alkhamdani**
